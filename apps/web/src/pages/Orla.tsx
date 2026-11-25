import { useStore } from '@nanostores/react';
import { $user, orlaService } from '@studate/shared';
import type { Expediente, GradeValue, StudateDate } from '@studate/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ExpedienteCard } from '../components/orla/ExpedienteCard';
import type { ExpedienteCardHandle } from '../components/orla/ExpedienteCard';
import { Icono } from '../components/Icono';
import { MatchScreen } from '../components/orla/MatchScreen';
import { UndoToast } from '../components/orla/UndoToast';
import { useToast } from '../context/ToastContext';
import { errorMessage, isAbort } from '../utils/api-error';

type Estado = 'cargando' | 'normal' | 'vacio' | 'error';

// Lo que se acaba de votar, para poder deshacerlo y para el aviso
interface Votado {
  gradeId: string;
  user: Expediente;
  value: GradeValue;
}

// La Orla: la pantalla principal del estudiante. Va trayendo Expedientes (GET /orla/next) y, con cada
// voto, carga el siguiente. El A+ mutuo abre el Date (pantalla ¡Date!). Se vota con los botones, con las
// flechas del teclado y deslizando la tarjeta (el gesto vive en ExpedienteCard).
export function Orla() {
  const me = useStore($user);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [estado, setEstado] = useState<Estado>('cargando');
  const [user, setUser] = useState<Expediente | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [votado, setVotado] = useState<Votado | null>(null);
  const [match, setMatch] = useState<StudateDate | null>(null);

  // La tarjeta: los botones F y A+ le piden que salga volando, igual que deslizar
  const cardRef = useRef<ExpedienteCardHandle>(null);

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

  // Estable para el aviso de deshacer (si no, su cuenta atrás se reiniciaría en cada render del padre)
  const ocultarAviso = useCallback(() => setVotado(null), []);

  const sinCupo = remaining <= 0;

  // Votar: la tarjeta ya ha salido volando; aquí se guarda el voto en la API y se carga el siguiente
  const handleVote = async (value: GradeValue) => {
    if (!user) {
      return;
    }
    const voted = user;
    try {
      const res = await orlaService.vote(voted._id, value);
      setRemaining(res.remaining);
      setVotado({ gradeId: res.grade._id, user: voted, value });
      if (res.date) {
        setMatch(res.date);
      }
      await loadNext();
    } catch (err) {
      showToast(errorMessage(err));
      await loadNext();
    }
  };

  // Deshacer: devuelve el Expediente anterior y, si ese A+ había abierto un Date, lo quita
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
      if (res.dateRemoved) {
        setMatch(null);
      }
    } catch (err) {
      showToast(errorMessage(err));
    }
  };

  // Las flechas del teclado: izquierda suspende, derecha aprueba, Retroceso deshace.
  // Solo cuando se está viendo un Expediente y no hay un ¡Date! encima
  useEffect(() => {
    if (estado !== 'normal' || match) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        cardRef.current?.swipe('F');
      } else if (e.key === 'ArrowRight' && !sinCupo) {
        cardRef.current?.swipe('A+');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, match, sinCupo]);

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
          <ExpedienteCard key={user._id} ref={cardRef} user={user} onVote={handleVote} aPlusDisabled={sinCupo} />

          <div className="acciones">
            <span className="voto-et">
              <button type="button" className="voto f" aria-label="Suspender" onClick={() => cardRef.current?.swipe('F')}>
                F
              </button>
              <span>SUSPENSO</span>
            </span>

            <button type="button" className="deshacer" aria-label="Deshacer" onClick={handleUndo} disabled={!votado}>
              <Icono nombre="deshacer" />
            </button>

            <span className="voto-et">
              <button type="button" className="voto a" aria-label="Aprobar" onClick={() => cardRef.current?.swipe('A+')} disabled={sinCupo}>
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

      {votado && (
        <UndoToast
          key={votado.gradeId}
          mensaje={`Has ${votado.value === 'A+' ? 'aprobado' : 'suspendido'} a ${votado.user.name.split(' ')[0]}`}
          onUndo={handleUndo}
          onExpire={ocultarAviso}
        />
      )}

      {match && me && (
        <MatchScreen
          date={match}
          meId={me._id}
          onGoDates={() => navigate('/dates')}
          onKeepSwiping={() => setMatch(null)}
        />
      )}
    </div>
  );
}
