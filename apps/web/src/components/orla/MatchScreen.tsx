import type { StudateDate } from '@studate/shared';

import { initials } from '../../utils/format';

interface MatchScreenProps {
  date: StudateDate;
  // El id del usuario con sesión, para saber quién es "yo" y quién la otra persona
  meId: string;
  onGoDates: () => void;
  onKeepSwiping: () => void;
}

// La pantalla ¡Tenéis Date! a pantalla completa, cuando un A+ mutuo abre un Date. Enseña a las dos
// personas, de quién es el primer turno (el sorteo) y deja seguir en La Orla o ir a Mis Dates.
export function MatchScreen({ date, meId, onGoDates, onKeepSwiping }: MatchScreenProps) {
  // La otra persona del Date (la que no soy yo), y a quién le toca escribir primero
  const other = date.users.find((u) => u._id !== meId) ?? date.users[0];
  const first = date.users.find((u) => u._id === date.firstTurn);
  const empiezoYo = date.firstTurn === meId;

  return (
    <div className="match" role="dialog" aria-modal="true" aria-label="¡Tenéis Date!">
      <div className="match-in">
        <span className="chip maiz">Aprobado mutuo</span>
        <h2>¡TENÉIS DATE!</h2>

        <div className="pareja">
          {date.users.map((u) =>
            u.photo ? (
              <img key={u._id} src={u.photo} alt={u.name} />
            ) : (
              <span key={u._id} className="pareja-sin">
                {initials(u.name)}
              </span>
            ),
          )}
        </div>

        <p className="match-nombres">{date.users.map((u) => u.name.split(' ')[0]).join(' y ')}</p>

        <div className="sorteo">
          <span className="et">Sorteo del turno de palabra</span>
          <b>{empiezoYo ? 'Te toca escribir primero a ti.' : `Le toca escribir a ${first?.name.split(' ')[0] ?? other.name.split(' ')[0]}.`}</b>
          <span className="sua">
            {empiezoYo
              ? 'Tienes 24 horas para romper el hielo.'
              : 'Tú te quedas con las ganas hasta que escriba. Tiene 24 horas.'}
          </span>
        </div>

        <button type="button" className="btn entero" onClick={onGoDates}>
          Ir a Mis Dates
        </button>
        <button type="button" className="btn2 entero" onClick={onKeepSwiping}>
          Seguir en La Orla
        </button>
      </div>
    </div>
  );
}
