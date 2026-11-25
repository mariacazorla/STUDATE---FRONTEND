import type { StudateDate } from '@studate/shared';
import { useState } from 'react';

import { useToast } from '../../context/ToastContext';
import { Icono } from '../Icono';
import { Ventana } from '../Ventana';
import { BloquearModal } from './BloquearModal';
import { ReportarModal } from './ReportarModal';

interface AccionesSeguridadProps {
  // La otra persona: a quién se bloquea o sobre quién se manda el parte
  user: { _id: string; name: string };
  // Desde qué Date, si estamos en un chat
  dateId?: string;
  // Bloqueado: el Date cerrado con el bloqueo (o null). Quien lo pone decide qué hacer (cargar otro
  // Expediente, salir del chat...)
  onBlocked: (date: StudateDate | null) => void;
  // Cómo se pinta el botón: dentro de la tarjeta del Expediente o en la cabecera del chat
  variante: 'expediente' | 'chat';
}

type Abierta = 'ninguna' | 'menu' | 'reportar' | 'bloquear';

// El botón de "más opciones" (los tres puntos) con sus ventanas: bloquear y mandar un parte. Está en el
// Expediente de La Orla y en la cabecera del chat, siempre a un toque, como pide el blog. Las ventanas
// se pintan con un portal, así que da igual dónde esté el botón
export function AccionesSeguridad({ user, dateId, onBlocked, variante }: AccionesSeguridadProps) {
  const { showToast } = useToast();
  const [ventana, setVentana] = useState<Abierta>('ninguna');
  const nombre = user.name.split(' ')[0];

  const cerrar = () => setVentana('ninguna');

  return (
    <>
      <button
        type="button"
        className={variante === 'expediente' ? 'icb mas' : 'icb'}
        aria-label="Más opciones"
        onClick={() => setVentana('menu')}
        // En la tarjeta del Expediente, pulsar el botón no debe empezar el gesto de deslizar
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Icono nombre="puntos" />
      </button>

      {ventana === 'menu' && (
        <Ventana label="Más opciones" onClose={cerrar}>
          <span className="et">{nombre}</span>
          <div className="opciones">
            <button type="button" className="opcion" onClick={() => setVentana('reportar')}>
              <Icono nombre="bandera" />
              Mandar un parte al equipo de Studate
            </button>
            <button type="button" className="opcion peligro" onClick={() => setVentana('bloquear')}>
              <Icono nombre="bloquear" />
              Bloquear a {nombre}
            </button>
          </div>
          <div className="botonera">
            <button type="button" className="btn2" onClick={cerrar}>
              Cancelar
            </button>
          </div>
        </Ventana>
      )}

      {ventana === 'reportar' && (
        <ReportarModal
          user={user}
          dateId={dateId}
          onCancel={cerrar}
          onBlock={() => setVentana('bloquear')}
          onSent={() => {
            cerrar();
            showToast('Parte enviado. El equipo de Studate lo revisará.');
          }}
        />
      )}

      {ventana === 'bloquear' && (
        <BloquearModal
          user={user}
          onCancel={cerrar}
          onBlocked={(date) => {
            cerrar();
            showToast(`Has bloqueado a ${nombre}.`);
            onBlocked(date);
          }}
        />
      )}
    </>
  );
}
