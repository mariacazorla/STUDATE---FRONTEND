import {
  DATE_CLOSED_REASON_LABELS,
  MESSAGE_MAX_LENGTH,
  dateService,
  isMyTurn,
  otherUser,
  remainingMs,
} from '@studate/shared';
import type { ChatSocket, Message, StudateDate } from '@studate/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';

import { useToast } from '../../context/ToastContext';
import { errorMessage, isAbort } from '../../utils/api-error';
import { initials } from '../../utils/format';
import { empezoEl, etiquetaDia, horaCorta, restanteLargo } from '../../utils/tiempo';
import { Icono } from '../Icono';
import { AccionesSeguridad } from '../seguridad/AccionesSeguridad';
import { BotonAyuda } from '../seguridad/BotonAyuda';
import type { EstadoChat } from '../../hooks/useChat';

type EstadoHistorial = 'cargando' | 'normal' | 'error';

interface CharlaProps {
  date: StudateDate;
  meId: string;
  // El socket de la pantalla (null mientras se abre) y cómo va la conexión
  socket: ChatSocket | null;
  conexion: EstadoChat;
  now: Date;
  // El Date ha cambiado (prórroga, primer mensaje, cierre): la lista también tiene que enterarse
  onDateUpdated: (date: StudateDate) => void;
  onBack: () => void;
}

// La conversación de un Date. Carga el historial por HTTP (la última página, con los más nuevos) y
// se suscribe al socket para lo que pasa ahora: los mensajes nuevos, el Date que cambia y las lecturas.
// Mientras el Date está pendiente solo escribe quien tiene el turno; en un Date cerrado se lee, no se escribe.
export function Charla({ date, meId, socket, conexion, now, onDateUpdated, onBack }: CharlaProps) {
  const { showToast } = useToast();
  const otro = otherUser(date, meId);
  const nombre = otro.name.split(' ')[0];

  const [estado, setEstado] = useState<EstadoHistorial>('cargando');
  const [messages, setMessages] = useState<Message[]>([]);
  // Hasta qué página del historial se ha cargado y cuántas hay (la 1 es la de los más nuevos)
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const finRef = useRef<HTMLDivElement>(null);

  // El historial: la primera página al abrir la conversación
  const loadHistory = useCallback(
    async (signal?: AbortSignal) => {
      setEstado('cargando');
      try {
        const res = await dateService.getMessages(date._id, 1, undefined, signal);
        setMessages(res.items);
        setPage(1);
        setPages(res.pages);
        setEstado('normal');
      } catch (err) {
        if (!isAbort(err)) {
          setEstado('error');
        }
      }
    },
    [date._id],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadHistory(controller.signal);
    return () => controller.abort();
  }, [loadHistory]);

  // Mensajes más antiguos: la siguiente página, que se pone delante de lo que ya hay
  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await dateService.getMessages(date._id, page + 1);
      setMessages((current) => [...res.items, ...current]);
      setPage(page + 1);
      setPages(res.pages);
    } catch (err) {
      showToast(errorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  };

  // La sala: entrar al abrir la conversación y salir al cambiar de Date o de pantalla.
  // Se vuelve a entrar en cada reconexión, porque el servidor no recuerda las salas de un socket que se fue
  useEffect(() => {
    if (!socket) {
      return;
    }
    const dateId = date._id;
    const join = () => socket.emit('date:join', { dateId });

    if (socket.connected) {
      join();
    }
    socket.on('connect', join);

    return () => {
      socket.off('connect', join);
      socket.emit('date:leave', { dateId });
    };
  }, [socket, date._id]);

  // Lo que llega por el socket de este Date
  useEffect(() => {
    if (!socket) {
      return;
    }
    const dateId = date._id;

    const onMessage = (message: Message) => {
      if (message.date !== dateId) {
        return;
      }
      setMessages((current) => [...current, message]);
      // Si lo ha escrito la otra persona y tengo la conversación delante, ya lo he leído
      if (message.from !== meId) {
        socket.emit('date:read', { dateId });
      }
    };

    const onUpdated = (updated: StudateDate) => {
      if (updated._id === dateId) {
        onDateUpdated(updated);
      }
    };

    // La otra persona ha leído: mis mensajes sin readAt pasan a leídos
    const onRead = (payload: { dateId: string; by: string; at: string }) => {
      if (payload.dateId !== dateId || payload.by === meId) {
        return;
      }
      setMessages((current) =>
        current.map((m) => (m.from === meId && !m.readAt ? { ...m, readAt: payload.at } : m)),
      );
    };

    const onError = (payload: { message: string }) => {
      setSending(false);
      showToast(payload.message);
    };

    socket.on('date:message', onMessage);
    socket.on('date:updated', onUpdated);
    socket.on('date:read', onRead);
    socket.on('chat:error', onError);

    return () => {
      socket.off('date:message', onMessage);
      socket.off('date:updated', onUpdated);
      socket.off('date:read', onRead);
      socket.off('chat:error', onError);
    };
  }, [socket, date._id, meId, onDateUpdated, showToast]);

  // Al abrir la conversación con el historial cargado, lo de la otra persona queda leído
  useEffect(() => {
    if (socket && estado === 'normal' && messages.some((m) => m.from !== meId && !m.readAt)) {
      socket.emit('date:read', { dateId: date._id });
    }
    // Solo cuando termina de cargar el historial: los mensajes nuevos ya se marcan al llegar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, estado]);

  // Cada mensaje nuevo baja la conversación hasta el final
  useEffect(() => {
    finRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, estado]);

  // Cuando llega mi propio mensaje por el socket, ya se puede escribir el siguiente
  useEffect(() => {
    if (sending && messages.length > 0 && messages[messages.length - 1].from === meId) {
      setSending(false);
    }
  }, [messages, sending, meId]);

  const cerrado = date.status === 'closed';
  const pendiente = date.status === 'pending';
  const miTurno = isMyTurn(date, meId);
  // Se puede escribir si el Date no está cerrado y, si está pendiente, es mi turno
  const puedoEscribir = !cerrado && (!pendiente || miTurno) && conexion === 'conectado';

  const send = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!socket || !puedoEscribir || !trimmed || sending) {
      return;
    }
    setSending(true);
    socket.emit('date:message', { dateId: date._id, text: trimmed });
    setText('');
  };

  // La prórroga: 24 horas más, una sola vez. La otra persona se entera por el socket
  const extend = async () => {
    try {
      const updated = await dateService.extendDate(date._id);
      onDateUpdated(updated);
      showToast('Prórroga usada: tenéis 24 horas más.');
    } catch (err) {
      showToast(errorMessage(err));
    }
  };

  const placeholder = cerrado
    ? 'Este Date está cerrado'
    : pendiente && !miTurno
      ? `Empieza ${nombre}…`
      : 'Escribe algo que merezca un A+…';

  return (
    <div className="charla card">
      <div>
        <div className="charla-cab">
          <button type="button" className="icb solo-movil" aria-label="Volver" onClick={onBack}>
            <Icono nombre="volver" />
          </button>
          {otro.photo ? (
            <img className="av" src={otro.photo} alt="" />
          ) : (
            <span className="ini-av">{initials(otro.name)}</span>
          )}
          <div className="quien">
            <b>{otro.name}</b>
            <span>{otro.email}</span>
          </div>
          {/* Siempre a un toque, como pide el blog: el botón de ayuda y más opciones (bloquear y mandar un parte) */}
          <div className="acc">
            {!cerrado && <BotonAyuda dateId={date._id} />}
            <AccionesSeguridad
              user={otro}
              dateId={date._id}
              variante="chat"
              onBlocked={(cerrado) => {
                if (cerrado) {
                  onDateUpdated(cerrado);
                }
                onBack();
              }}
            />
          </div>
        </div>

        <div className="franja-turno">
          {cerrado ? (
            <>
              <span className="chip ko">Cerrado</span>
              <span className="sua">
                {date.closedReason ? DATE_CLOSED_REASON_LABELS[date.closedReason] : 'Este Date se ha cerrado'}
              </span>
            </>
          ) : pendiente ? (
            <>
              <span className="chip">
                <Icono nombre="fuego" />
                Pendiente
              </span>
              <span className="reloj">
                <Icono nombre="reloj" />
                {miTurno ? 'Te toca empezar. ' : `Empieza ${nombre}. `}
                Quedan {restanteLargo(remainingMs(date, now))}
              </span>
              {!date.extended && (
                <button type="button" className="btn2" onClick={extend}>
                  Pedir prórroga (+24 h)
                </button>
              )}
            </>
          ) : (
            <>
              <span className="chip azul">
                <Icono nombre="corazon" />
                En curso
              </span>
              {date.startedAt && <span className="sua">Empezó {empezoEl(date.startedAt, now)}</span>}
            </>
          )}
        </div>
      </div>

      {estado === 'cargando' && (
        <div className="mensajes" aria-busy="true">
          <span className="esq" style={{ width: '60%', height: 40 }} />
          <span className="esq" style={{ width: '55%', height: 40, justifySelf: 'end' }} />
          <span className="esq" style={{ width: '70%', height: 40 }} />
        </div>
      )}

      {estado === 'error' && (
        <div className="mensajes">
          <div className="vacio">
            <b>No se ha podido cargar la conversación.</b>
            <span className="sua">Vuelve a probar cuando tengas conexión.</span>
            <button type="button" className="btn" onClick={() => loadHistory()}>
              Reintentar
            </button>
          </div>
        </div>
      )}

      {estado === 'normal' && (
        <div className="mensajes">
          {page < pages && (
            <button type="button" className="btn2" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Cargando…' : 'Ver mensajes anteriores'}
            </button>
          )}

          {messages.length === 0 && (
            <div className="vacio centrado">
              <b>Aún no hay mensajes.</b>
              <span className="sua">
                {cerrado
                  ? 'Este Date se cerró sin que nadie escribiera.'
                  : miTurno
                    ? `Te toca escribir a ti: tienes ${restanteLargo(remainingMs(date, now))}.`
                    : `Empieza ${nombre}. Tú te quedas con las ganas hasta que escriba.`}
              </span>
            </div>
          )}

          {messages.map((m, i) => {
            const mio = m.from === meId;
            const nuevoDia = i === 0 || etiquetaDia(messages[i - 1].createdAt, now) !== etiquetaDia(m.createdAt, now);
            return (
              <div key={m._id} style={{ display: 'contents' }}>
                {nuevoDia && <span className="dia-sep">{etiquetaDia(m.createdAt, now)}</span>}
                <div className={`msg${mio ? ' yo' : ''}`}>
                  {m.text}
                  <small>
                    {horaCorta(m.createdAt)}
                    {mio && (m.readAt ? ' ✓✓' : ' ✓')}
                  </small>
                </div>
              </div>
            );
          })}

          <div ref={finRef} />
        </div>
      )}

      <form className="escribir" onSubmit={send}>
        <input
          aria-label="Mensaje"
          placeholder={conexion === 'error' ? 'Sin conexión con el chat' : placeholder}
          value={text}
          maxLength={MESSAGE_MAX_LENGTH}
          disabled={!puedoEscribir}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="enviar" aria-label="Enviar" disabled={!puedoEscribir || !text.trim() || sending}>
          <Icono nombre="enviar" />
        </button>
      </form>
    </div>
  );
}
