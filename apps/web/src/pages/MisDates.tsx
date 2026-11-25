import { useStore } from '@nanostores/react';
import { $user, dateService } from '@studate/shared';
import type { StudateDate } from '@studate/shared';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ListaDates } from '../components/dates/ListaDates';
import type { Bandeja } from '../components/dates/ListaDates';
import { Icono } from '../components/Icono';
import { useNow } from '../hooks/useNow';
import { isAbort } from '../utils/api-error';

type Estado = 'cargando' | 'normal' | 'error';

// Mis Dates: las bandejas de Pendientes y En curso con su reloj y, al lado (en escritorio) o en su
// propia pantalla (en el móvil), la conversación del Date elegido. La misma pantalla sirve para
// /dates (la lista) y /dates/:dateId (con un Date abierto): en escritorio se ven las dos columnas y en
// el móvil solo una, con el botón de volver.
export function MisDates() {
  const me = useStore($user);
  const navigate = useNavigate();
  const { dateId } = useParams<{ dateId: string }>();
  const now = useNow();

  const [estado, setEstado] = useState<Estado>('cargando');
  const [dates, setDates] = useState<StudateDate[]>([]);
  const [bandeja, setBandeja] = useState<Bandeja>('pending');

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

  const selected = dateId ? dates.find((d) => d._id === dateId) : undefined;

  if (!me) {
    return null;
  }

  return (
    <div className={`dates${dateId ? ' con-chat' : ''}`}>
      <div className="lista-col">
        <h1 className="t1">Mis Dates</h1>

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
          <div className="charla card">
            <div className="charla-cab">
              <button type="button" className="icb solo-movil" aria-label="Volver" onClick={() => navigate('/dates')}>
                <Icono nombre="volver" />
              </button>
              <div className="quien">
                <b>{selected ? 'Conversación' : 'Date'}</b>
                <span>El chat llega en la siguiente tarea</span>
              </div>
            </div>
            <div className="mensajes" />
            <div className="escribir">
              <input aria-label="Mensaje" placeholder="Escribe algo que merezca un A+…" disabled />
              <button type="button" className="enviar" aria-label="Enviar" disabled>
                <Icono nombre="enviar" />
              </button>
            </div>
          </div>
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
