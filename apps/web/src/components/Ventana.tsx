import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface VentanaProps {
  // Para el lector de pantalla: qué es esta ventana
  label: string;
  onClose: () => void;
  children: ReactNode;
}

// Una ventana encima de la pantalla (las de seguridad: bloquear, mandar un parte y pedir ayuda).
// Es el mismo patrón que ConfirmModal, pero con el contenido libre y, en el móvil, pegada abajo como
// una hoja. Se pinta con un portal en el body: así funciona aunque quien la abra esté dentro de un
// elemento con transform (la tarjeta del Expediente), donde position: fixed no se comportaría bien.
// Escape y un clic fuera la cierran.
export function Ventana({ label, onClose, children }: VentanaProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Un portal pinta en el body, pero los eventos de React siguen subiendo por el árbol de componentes:
  // sin este stopPropagation, pulsar dentro de la ventana llegaría al onPointerDown de la tarjeta del
  // Expediente, que capturaría el puntero y se quedaría con el clic
  return createPortal(
    <div className="capa" onClick={onClose} onPointerDown={(e) => e.stopPropagation()}>
      {/* stopPropagation: un clic dentro no cierra la ventana */}
      <div
        className="ventana card"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
