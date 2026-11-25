import type { Expediente, GradeValue } from '@studate/shared';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';

import { edad, initials } from '../../utils/format';
import { SWIPE_ROTATION, SWIPE_THRESHOLD, prefersReducedMotion, voteFromDrag } from './swipe';

// Lo que el padre puede pedirle a la tarjeta: votar con una animación de "sale volando". Lo usan los
// botones F y A+, que hacen lo mismo que deslizar
export interface ExpedienteCardHandle {
  swipe: (value: GradeValue) => void;
}

interface ExpedienteCardProps {
  user: Expediente;
  // Se llama cuando la tarjeta ya ha salido (por gesto o por botón): el padre vota y carga el siguiente
  onVote: (value: GradeValue) => void;
  // true si ya no quedan A+ hoy: deslizar a la derecha no hace nada
  aPlusDisabled: boolean;
  // Lo que va en la esquina de la foto: el botón de más opciones (bloquear y mandar un parte)
  acciones?: ReactNode;
}

// La tarjeta del Expediente, con el gesto de deslizar (Pointer Events: vale para el ratón y para el dedo).
// La tarjeta sigue al dedo con una rotación ligera y enseña un sello A+ o F según el lado; al soltar, si
// se ha pasado del umbral, sale volando y vota; si no, vuelve a su sitio. Un arrastre corto no vota.
export const ExpedienteCard = forwardRef<ExpedienteCardHandle, ExpedienteCardProps>(function ExpedienteCard(
  { user, onVote, aPlusDisabled, acciones },
  ref,
) {
  // dx: cuánto se ha arrastrado en horizontal. dragging: si el dedo está pulsado. flying: dirección en la
  // que la tarjeta está saliendo (null mientras no vuela)
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [flying, setFlying] = useState<GradeValue | null>(null);
  const startX = useRef(0);

  // Votar con animación: la tarjeta sale volando hacia su lado y, al acabar, el padre vota.
  // Si el usuario ha pedido menos animaciones, se vota directamente
  const commit = (value: GradeValue) => {
    if (flying) {
      return;
    }
    if (prefersReducedMotion()) {
      onVote(value);
      return;
    }
    setFlying(value);
  };

  // Los botones F y A+ del padre usan esto
  useImperativeHandle(ref, () => ({ swipe: commit }));

  const onPointerDown = (e: ReactPointerEvent) => {
    if (flying) {
      return;
    }
    setDragging(true);
    startX.current = e.clientX;
    // Capturar el puntero: el gesto sigue aunque el dedo se salga de la tarjeta
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (dragging) {
      setDx(e.clientX - startX.current);
    }
  };

  const onPointerUp = () => {
    if (!dragging) {
      return;
    }
    setDragging(false);
    const value = voteFromDrag(dx);

    // Si no se ha llegado al umbral, o es un A+ sin cupo, la tarjeta vuelve a su sitio
    if (!value || (value === 'A+' && aPlusDisabled)) {
      setDx(0);
      return;
    }
    commit(value);
  };

  // Cuando la animación de salir volando acaba, el padre vota (y cambia de Expediente)
  const onTransitionEnd = () => {
    if (flying) {
      onVote(flying);
    }
  };

  // Posición de la tarjeta: mientras vuela, muy a un lado; si no, lo que marque el arrastre
  const offset = flying ? (flying === 'A+' ? 1 : -1) * 600 : dx;
  const rotation = offset / SWIPE_ROTATION;
  // Los sellos aparecen a medida que se arrastra hacia su lado (0 a 1)
  const stampAplus = Math.min(1, Math.max(0, offset / SWIPE_THRESHOLD));
  const stampF = Math.min(1, Math.max(0, -offset / SWIPE_THRESHOLD));

  const años = edad(user.birthDate);

  return (
    <div
      className="exp card"
      style={{
        transform: `translateX(${offset}px) rotate(${rotation}deg)`,
        // Sin transición mientras se arrastra (la tarjeta tiene que seguir al dedo al instante);
        // con transición al soltar (vuelve) o al votar (sale volando)
        transition: dragging ? 'none' : 'transform 0.28s ease',
        touchAction: 'pan-y',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onTransitionEnd={onTransitionEnd}
    >
      <div className="foto">
        {user.photo ? (
          <img src={user.photo} alt={user.name} draggable={false} />
        ) : (
          <div className="foto-sin">{initials(user.name)}</div>
        )}

        {/* Los sellos del gesto: A+ al deslizar a la derecha, F a la izquierda */}
        <span className="sello sello-a" style={{ opacity: stampAplus }} aria-hidden="true">
          <b>A+</b>
        </span>
        <span className="sello sello-f" style={{ opacity: stampF }} aria-hidden="true">
          <b>F</b>
        </span>

        {acciones}

        <div className="sobre">
          <p className="nombre">
            {user.name}
            {años !== undefined ? `, ${años}` : ''}
          </p>
          {user.degree && <div className="dato">{user.degree}</div>}
          {user.lookingFor && <div className="gustos">Busca: {user.lookingFor}</div>}
          {user.bio && <p className="bio-exp">{user.bio}</p>}
        </div>
      </div>
    </div>
  );
});
