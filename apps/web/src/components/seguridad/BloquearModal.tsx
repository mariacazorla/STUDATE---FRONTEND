import { ApiError, blockService } from '@studate/shared';
import type { StudateDate } from '@studate/shared';
import { useState } from 'react';

import { errorMessage } from '../../utils/api-error';
import { Icono } from '../Icono';
import { Ventana } from '../Ventana';

interface BloquearModalProps {
  // A quién
  user: { _id: string; name: string };
  onCancel: () => void;
  // Bloqueado: el Date que se ha cerrado con el bloqueo, o null si no había
  onBlocked: (date: StudateDate | null) => void;
}

type Estado = 'normal' | 'cargando' | 'ya' | 'error';

// La ventana de bloquear: explica qué pasa (se cierra el Date, desaparecéis el uno del otro, no se le
// avisa) y pide confirmación. Es una acción de peligro: el botón va en rojo
export function BloquearModal({ user, onCancel, onBlocked }: BloquearModalProps) {
  const [estado, setEstado] = useState<Estado>('normal');
  const [error, setError] = useState('');
  const nombre = user.name.split(' ')[0];

  const bloquear = async () => {
    setEstado('cargando');
    try {
      const res = await blockService.block(user._id);
      onBlocked(res.date);
    } catch (err) {
      // 409: ya estaba bloqueado. No es un error de verdad: se avisa y se cierra como si hubiera ido bien
      if (err instanceof ApiError && err.status === 409) {
        setEstado('ya');
        return;
      }
      setError(errorMessage(err));
      setEstado('error');
    }
  };

  return (
    <Ventana label="Bloquear" onClose={onCancel}>
      <span className="et">Bloquear</span>

      {estado === 'ya' ? (
        <>
          <b className="t-ventana">Ya tienes bloqueada a esta persona.</b>
          <div className="botonera">
            <button type="button" className="btn2" onClick={() => onBlocked(null)}>
              Entendido
            </button>
          </div>
        </>
      ) : (
        <>
          <b className="t-ventana">¿Bloquear a {nombre}?</b>
          <span className="sua">
            Se cierra el Date. {nombre} desaparece de tu Orla y de tus chats, y tú de los suyos. No se le
            avisa.
          </span>
          {estado === 'error' && <div className="aviso">{error || 'No se ha podido bloquear.'}</div>}
          <div className="botonera">
            <button type="button" className="btn2" onClick={onCancel} disabled={estado === 'cargando'}>
              Cancelar
            </button>
            <button type="button" className="btn peligro" onClick={bloquear} disabled={estado === 'cargando'}>
              <Icono nombre="bloquear" />
              {estado === 'cargando' ? 'Bloqueando…' : estado === 'error' ? 'Reintentar' : 'Bloquear'}
            </button>
          </div>
        </>
      )}
    </Ventana>
  );
}
