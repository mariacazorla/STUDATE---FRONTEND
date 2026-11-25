import type { ReactNode } from 'react';

import { Marca } from './Marca';

interface AccesoProps {
  // El lema grande de la portada (puede llevar un <em> para la parte en amarillo)
  lema: ReactNode;
  // La frase pequeña de debajo
  texto: string;
  // El formulario
  children: ReactNode;
}

// La maquetación de las pantallas de acceso (login y registro), que no llevan menú: la portada con
// el logo y el lema, y al lado el formulario. En el móvil la portada va arriba y más corta; en
// escritorio, a la izquierda. Lo decide el CSS global (.acceso).
export function Acceso({ lema, texto, children }: AccesoProps) {
  return (
    <div className="acceso">
      <div className="portada">
        <Marca />
        <p className="lema">{lema}</p>
        <p>{texto}</p>
      </div>
      <div className="form">{children}</div>
    </div>
  );
}
