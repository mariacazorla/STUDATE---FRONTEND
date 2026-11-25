import { orlaService } from '@studate/shared';
import type { Expediente, GradeValue } from '@studate/shared';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ExpedienteCard } from '../components/orla/ExpedienteCard';
import { Icono } from '../components/Icono';
import { useToast } from '../context/ToastContext';
import { errorMessage, isAbort } from '../utils/api-error';

type Estado = 'cargando' | 'normal' | 'vacio' | 'error';

// Lo que se acaba de votar, para poder deshacerlo (el botón de deshacer)
interface Votado {
  gradeId: string;
  user: Expediente;
}

// La Orla: la pantalla principal del estudiante. Va trayendo Expedientes (GET /orla/next) y, con cada
// voto, carga el siguiente. Se vota con los botones F y A+, y también con las flechas del teclado.
export function Orla() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [estado, setEstado] = useState<Estado>('cargando');
  const [user, setUser] = useState<Expediente | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [votado, setVotado] = useState<Votado | null>(null);

  // Pide el siguiente Expediente. useCallback: estable para poder usarla en los efectos
  const loadNext = useCallback(async (signal?: AbortSignal) => {
    setEstado('cargando');
    try {
      const res = await orlaService.next(signal);
      setRemaining(res.remaining);
      if (res.user) {
        setUser(res.user);
        setEstado('normal');
      } else {
        setUser(null);
        setEstado('vacio');
      }
    } catch (err) {
      if (!isAbort(err)) {
        setEstado('error');
      }
    }
  }, []);

  // Al entrar en La Orla, el primer Expediente
  useEffect(() => {
    const controller = new AbortController();
    loadNext(controller.signal);
    return () => controller.abort();
  }, [loadNext]);

  const sinCupo = remaining <= 0;

  // Votar: guarda el voto en la API y carga el siguiente Expediente
  const handleVote = async (value: GradeValue) => {
    if (!user || (value === 'A+' && sinCupo)) {
      return;
    }
    const voted = user;
    try {
      const res = await orlaService.vote(voted._id, value);
      setRemaining(res.remaining);
      setVotado({ gradeId: res.grade._id, user: voted });
      await loadNext();
    } catch (err) {
      showToast(errorMessage(err));
      await loadNext();
    }
  };

  // Deshacer: devuelve el Expediente anterior
  const handleUndo = async () => {
    if (!votado) {
      return;
    }
    const anterior = votado;
    setVotado(null);
    try {
      const res = await orlaService.undo(anterior.gradeId);
      setRemaining(res.remaining);
      setUser(anterior.user);
      setEstado('normal');
    } catch (err) {
      showToast(errorMessage(err));
    }
  };

  // Las flechas del teclado: izquierda suspende, derecha aprueba, Retroceso deshace.
  // Solo cuando se está viendo un Expediente
  useEffect(() => {
    if (estado !== 'normal') {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handleVote('F');
      } else if (e.key === 'ArrowRight') {
        handleVote('A+');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, user, votado, sinCupo]);

  return (
    <div className="orla">
      <div className="orla-cab">
        <h1 className="t1">La Orla</h1>
        <span className="cupo">
          <span className="est">★</span>
          Te quedan <b>{remaining}</b> aprobados hoy
        </span>
      </div>

      {estado === 'cargando' && (
        <div className="orla-centro" aria-busy="true">
          <span className="esq alto" style={{ maxWidth: 420, width: '100%' }} />
        </div>
      )}

      {estado === 'error' && (
        <div className="vacio">
          <b>No hemos podido cargar La Orla.</b>
          <span className="sua">No se ha perdido ningún voto. Comprueba la conexión y vuelve a probar.</span>
          <button type="button" className="btn" onClick={() => loadNext()}>
            Reintentar
          </button>
        </div>
      )}

      {estado === 'vacio' && (
        <div className="vacio">
          <b>Ya has visto a todo tu campus por hoy.</b>
          <span className="sua">Cuando haya Expedientes nuevos, volverán a salir aquí.</span>
          <button type="button" className="btn2" onClick={() => navigate('/dates')}>
            Ir a Mis Dates
          </button>
        </div>
      )}

      {estado === 'normal' && user && (
        <div className="orla-centro">
          <ExpedienteCard key={user._id} user={user} />

          <div className="acciones">
            <span className="voto-et">
              <button type="button" className="voto f" aria-label="Suspender" onClick={() => handleVote('F')}>
                F
              </button>
              <span>SUSPENSO</span>
            </span>

            <button type="button" className="deshacer" aria-label="Deshacer" onClick={handleUndo} disabled={!votado}>
              <Icono nombre="deshacer" />
            </button>

            <span className="voto-et">
              <button type="button" className="voto a" aria-label="Aprobar" onClick={() => handleVote('A+')} disabled={sinCupo}>
                A+
              </button>
              <span>APROBADO</span>
            </span>
          </div>

          {sinCupo ? (
            <p className="teclas">Has llegado a los 30 A+ de hoy. Vuelve mañana. (Las F siguen contando)</p>
          ) : (
            <p className="teclas">
              Con el teclado: <kbd>←</kbd> suspenso · <kbd>→</kbd> aprobado · <kbd>Retroceso</kbd> deshace
            </p>
          )}
        </div>
      )}
    </div>
  );
}
