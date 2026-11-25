import { useStore } from '@nanostores/react';
import { $user, dateService, replaceDate } from '@studate/shared';
import type { StudateDate } from '@studate/shared';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Charla } from '../components/dates/Charla';
import { ListaDates } from '../components/dates/ListaDates';
import type { Bandeja } from '../components/dates/ListaDates';
import { Icono } from '../components/Icono';
import { useChat } from '../hooks/useChat';
import { useNow } from '../hooks/useNow';
import { isAbort } from '../utils/api-error';

type Estado = 'cargando' | 'normal' | 'error';

// Mis Dates: las bandejas de Pendientes y En curso con su reloj y, al lado (en escritorio) o en su
// propia pantalla (en el móvil), la conversación del Date elegido. La misma pantalla sirve para
// /dates (la lista) y /dates/:dateId (con un Date abierto): en escritorio se ven las dos columnas y en
// el móvil solo una, con el botón de volver.
//
// El socket del chat se abre aquí, una vez para toda la pantalla: la conversación lo usa para la sala
// de su Date, y la lista escucha date:updated para mover un Date de bandeja sin recargar.
export function MisDates() {
  const me = useStore($user);
  const navigate = useNavigate();
  const { dateId } = useParams<{ dateId: string }>();
  const now = useNow();
  const { socket, estado: conexion, error: errorChat } = useChat();

  const [estado, setEstado] = useState<Estado>('cargando');
  const [dates, setDates] = useState<StudateDate[]>([]);
  const [bandeja, setBandeja] = useState<Bandeja>('pending');
  // Un Date abierto por su URL que no está en las bandejas (por ejemplo, uno cerrado)
  const [aparte, setAparte] = useState<StudateDate | null>(null);

  // Todos mis Dates de una vez (un estudiante tiene pocos: el límite máximo de la API sobra)
  const load = useCallback(async (signal?: AbortSignal) => {
    setEstado('cargando');
    try {
      const page = await dateService.getMyDates(signal);
      setDates(page.items);
      // Se abre la bandeja que tenga algo: si no hay pendientes, la de En curso
      setBandeja(page.items.some((d) => d.status === 'pending') ? 'pending' : 'ongoing');
      setEstado('normal');
    } catch (err) {
      if (!isAbort(err)) {
        setEstado('error');
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  // Un Date que ha cambiado (por el socket o por una acción mía) sustituye al suyo en la lista.
  // useCallback: la conversación lo recibe por props y lo usa en un efecto
  const onDateUpdated = useCallback((updated: StudateDate) => {
    setDates((current) => replaceDate(current, updated));
    setAparte((current) => (current && current._id === updated._id ? updated : current));
  }, []);

  // Mientras estoy en Mis Dates, cualquier Date mío que cambie se actualiza en la lista (la sala de
  // cada Date la abre la conversación; aquí solo se escucha)
  useEffect(() => {
    if (!socket) {
      return;
    }
    socket.on('date:updated', onDateUpdated);
    return () => {
      socket.off('date:updated', onDateUpdated);
    };
  }, [socket, onDateUpdated]);

  const selected = dateId ? (dates.find((d) => d._id === dateId) ?? aparte) : undefined;

  // Un Date de la URL que no está en la lista (cerrado, o la lista aún no ha llegado): se pide aparte
  useEffect(() => {
    if (!dateId || estado !== 'normal' || dates.some((d) => d._id === dateId)) {
      return;
    }
    const controller = new AbortController();
    dateService
      .getDate(dateId, controller.signal)
      .then(setAparte)
      .catch((err) => {
        if (!isAbort(err)) {
          navigate('/dates', { replace: true });
        }
      });
    return () => controller.abort();
  }, [dateId, estado, dates, navigate]);

  if (!me) {
    return null;
  }

  return (
    <div className={`dates${dateId ? ' con-chat' : ''}`}>
      <div className="lista-col">
        <h1 className="t1">Mis Dates</h1>

        {conexion === 'error' && (
          <div className="aviso" role="alert">
            Sin conexión con el chat{errorChat ? `: ${errorChat}` : ''}. Las conversaciones se verán, pero
            no llegarán mensajes nuevos.
          </div>
        )}

        {estado === 'cargando' && (
          <div className="pila junta" aria-busy="true">
            <span className="esq" style={{ height: 50 }} />
            <span className="esq" style={{ height: 72 }} />
            <span className="esq" style={{ height: 72 }} />
          </div>
        )}

        {estado === 'error' && (
          <div className="vacio">
            <b>No hemos podido cargar tus Dates.</b>
            <span className="sua">Tus conversaciones están a salvo. Vuelve a probar.</span>
            <button type="button" className="btn" onClick={() => load()}>
              Reintentar
            </button>
          </div>
        )}

        {estado === 'normal' &&
          (dates.some((d) => d.status !== 'closed') ? (
            <ListaDates
              dates={dates}
              meId={me._id}
              bandeja={bandeja}
              onBandeja={setBandeja}
              selectedId={dateId}
              onSelect={(date) => navigate(`/dates/${date._id}`)}
              now={now}
            />
          ) : (
            <div className="vacio">
              <b>Aún no tienes Dates.</b>
              <span className="sua">
                Un Date se abre solo cuando tú y otra persona os ponéis A+ en La Orla.
              </span>
              <button type="button" className="btn" onClick={() => navigate('/orla')}>
                Ir a La Orla
              </button>
            </div>
          ))}
      </div>

      <div className="chatcol">
        {dateId ? (
          selected ? (
            <Charla
              key={selected._id}
              date={selected}
              meId={me._id}
              socket={socket}
              conexion={conexion}
              now={now}
              onDateUpdated={onDateUpdated}
              onBack={() => navigate('/dates')}
            />
          ) : (
            <div className="charla card" aria-busy="true">
              <div className="charla-cab">
                <button type="button" className="icb solo-movil" aria-label="Volver" onClick={() => navigate('/dates')}>
                  <Icono nombre="volver" />
                </button>
                <span className="esq" style={{ width: 160, height: 20 }} />
              </div>
              <div className="mensajes" />
              <div className="escribir">
                <input aria-label="Mensaje" disabled />
                <button type="button" className="enviar" aria-label="Enviar" disabled>
                  <Icono nombre="enviar" />
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="vacio centrado">
            <Icono nombre="chat" />
            <b>Elige un Date para ver la conversación.</b>
            <span className="sua">En escritorio, la bandeja y la conversación se ven a la vez.</span>
          </div>
        )}
      </div>
    </div>
  );
}
