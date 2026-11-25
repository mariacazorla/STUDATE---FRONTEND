import type { Expediente } from '@studate/shared';

import { edad, initials } from '../../utils/format';

interface ExpedienteCardProps {
  user: Expediente;
}

// La tarjeta del Expediente: la foto (o las iniciales si no hay) y, encima, el nombre con la edad, la
// titulación, qué busca y la bio. Es lo que se ve de otro estudiante en La Orla. De momento solo se
// vota con los botones; el gesto de deslizar llega en la tarea siguiente.
export function ExpedienteCard({ user }: ExpedienteCardProps) {
  const años = edad(user.birthDate);

  return (
    <div className="exp card">
      <div className="foto">
        {user.photo ? (
          <img src={user.photo} alt={user.name} draggable={false} />
        ) : (
          <div className="foto-sin">{initials(user.name)}</div>
        )}

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
}
