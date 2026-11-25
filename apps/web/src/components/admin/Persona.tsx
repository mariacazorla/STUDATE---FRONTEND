import type { ReactNode } from 'react';

import { initials } from '../../utils/format';

interface PersonaProps {
  user: { name: string; email?: string; photo?: string };
  // Lo que va debajo del nombre (por defecto, el email)
  detalle?: ReactNode;
  // Solo el avatar y el nombre, en una línea (para las parejas y los votos)
  compacta?: boolean;
}

// Una persona en una tabla del backoffice: su avatar (foto o iniciales), el nombre y un detalle
export function Persona({ user, detalle, compacta }: PersonaProps) {
  const avatar = user.photo ? (
    <img className="av" src={user.photo} alt="" />
  ) : (
    <span className="ini-av">{initials(user.name)}</span>
  );

  if (compacta) {
    return (
      <span className="persona">
        {avatar}
        <b>{user.name}</b>
      </span>
    );
  }

  return (
    <span className="persona">
      {avatar}
      <span>
        <b>{user.name}</b>
        <span>{detalle ?? user.email}</span>
      </span>
    </span>
  );
}
