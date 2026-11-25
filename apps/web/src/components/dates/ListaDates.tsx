import { isMyTurn, otherUser, remainingMs } from '@studate/shared';
import type { DateStatus, StudateDate } from '@studate/shared';

import { initials } from '../../utils/format';
import { empezoEl, horaCorta, restanteCorto } from '@studate/shared';
import { Icono } from '../Icono';

// Las dos bandejas de Mis Dates, como en el blog: Pendientes (fuego), donde todavía no ha llegado el
// primer mensaje, y En curso (corazón), donde ya están hablando. Los cerrados no se listan
export type Bandeja = Extract<DateStatus, 'pending' | 'ongoing'>;

interface ListaDatesProps {
  dates: StudateDate[];
  meId: string;
  bandeja: Bandeja;
  onBandeja: (bandeja: Bandeja) => void;
  // El Date abierto (marcado en la lista), si hay
  selectedId?: string;
  onSelect: (date: StudateDate) => void;
  now: Date;
}

// La lista de Mis Dates: las bandejas con sus contadores, el aviso de los que esperan que escriba yo,
// y una tarjeta por Date con la otra persona, a quién le toca y el reloj
export function ListaDates({ dates, meId, bandeja, onBandeja, selectedId, onSelect, now }: ListaDatesProps) {
  const pendientes = dates.filter((d) => d.status === 'pending');
  const enCurso = dates.filter((d) => d.status === 'ongoing');
  const visibles = bandeja === 'pending' ? pendientes : enCurso;

  // Los Dates pendientes en los que me toca escribir a mí, y el que antes caduca
  const miTurno = pendientes.filter((d) => isMyTurn(d, meId));
  const masUrgente = miTurno.reduce<number | null>((min, d) => {
    const ms = remainingMs(d, now);
    return min === null || ms < min ? ms : min;
  }, null);

  return (
    <div className="pila">
      <div className="bandejas" role="tablist" aria-label="Bandejas">
        <button type="button" role="tab" aria-pressed={bandeja === 'pending'} onClick={() => onBandeja('pending')}>
          <Icono nombre="fuego" />
          Pendientes
          <span className="n">{pendientes.length}</span>
        </button>
        <button type="button" role="tab" aria-pressed={bandeja === 'ongoing'} onClick={() => onBandeja('ongoing')}>
          <Icono nombre="corazon" />
          En curso
          <span className="n azul">{enCurso.length}</span>
        </button>
      </div>

      {miTurno.length > 0 && masUrgente !== null && (
        <div className="avisador">
          <Icono nombre="reloj" />
          <span>
            {miTurno.length === 1 ? (
              <>
                Tienes <b>1 Date</b> esperando que escribas tú.
              </>
            ) : (
              <>
                Tienes <b>{miTurno.length} Dates</b> esperando que escribas tú.
              </>
            )}{' '}
            Quedan <b>{restanteCorto(masUrgente)}</b>.
          </span>
        </div>
      )}

      {visibles.length === 0 ? (
        <div className="vacio">
          <b>{bandeja === 'pending' ? 'No tienes Dates pendientes.' : 'No tienes Dates en curso.'}</b>
          <span className="sua">
            {bandeja === 'pending'
              ? 'Cuando tú y otra persona os pongáis A+ en La Orla, el Date aparecerá aquí.'
              : 'Un Date pasa a En curso con el primer mensaje del chat.'}
          </span>
        </div>
      ) : (
        <ul className="conv">
          {visibles.map((date) => {
            const otro = otherUser(date, meId);
            const nombre = otro.name.split(' ')[0];
            const seleccionado = date._id === selectedId;

            return (
              <li key={date._id}>
                <button
                  type="button"
                  className={`card${seleccionado ? ' sel' : ''}`}
                  aria-current={seleccionado ? 'true' : undefined}
                  onClick={() => onSelect(date)}
                >
                  {otro.photo ? (
                    <img className="av" src={otro.photo} alt="" />
                  ) : (
                    <span className="ini-av">{initials(otro.name)}</span>
                  )}

                  <div className="quien">
                    <b>{nombre}</b>
                    <span className="ult">
                      {date.status === 'pending'
                        ? isMyTurn(date, meId)
                          ? 'Te toca escribir a ti'
                          : `Empieza ${nombre}`
                        : date.startedAt
                          ? `Empezó ${empezoEl(date.startedAt, now)}`
                          : 'En curso'}
                    </span>
                  </div>

                  <div className="der">
                    {date.status === 'pending' ? (
                      <span className="reloj">
                        <Icono nombre="reloj" />
                        {restanteCorto(remainingMs(date, now))}
                      </span>
                    ) : (
                      date.startedAt && <span>{horaCorta(date.startedAt)}</span>
                    )}
                    {date.extended && <span className="chip">Prórroga</span>}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
