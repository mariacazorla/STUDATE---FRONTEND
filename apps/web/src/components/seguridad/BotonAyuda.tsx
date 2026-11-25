import { useState } from 'react';

import { useToast } from '../../context/ToastContext';
import { Icono } from '../Icono';
import { AyudaModal } from './AyudaModal';

interface BotonAyudaProps {
  dateId: string;
}

// El botón de ayuda de la cabecera del chat: el escudo rojo. Siempre visible y a un toque, como pide el
// blog; abre la ventana de confirmación y, al pedir ayuda, avisa de a quién se ha avisado
export function BotonAyuda({ dateId }: BotonAyudaProps) {
  const { showToast } = useToast();
  const [abierta, setAbierta] = useState(false);

  return (
    <>
      <button
        type="button"
        className="icb alerta"
        aria-label="Pedir ayuda"
        title="Pedir ayuda"
        onClick={() => setAbierta(true)}
      >
        <Icono nombre="escudo" />
      </button>

      {abierta && (
        <AyudaModal
          dateId={dateId}
          onCancel={() => setAbierta(false)}
          onSent={(contactos) => {
            setAbierta(false);
            showToast(
              contactos > 0
                ? `Aviso enviado al equipo de Studate y a ${contactos === 1 ? 'tu contacto' : `tus ${contactos} contactos`} de confianza.`
                : 'Aviso enviado al equipo de Studate.',
            );
          }}
        />
      )}
    </>
  );
}
