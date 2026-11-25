import {
  DATE_CLOSED_REASON_LABELS,
  DATE_STATUS_LABELS,
  PLAN_STATUS_LABELS,
  dateService,
  planService,
  remainingMs,
} from '@studate/shared';
import type { DateFilters, Plan, PlanFilters, StudateDate } from '@studate/shared';
import { useCallback, useState } from 'react';

import { EstadoLista } from '../../components/admin/EstadoLista';
import { PaginacionBo } from '../../components/admin/PaginacionBo';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Icono } from '../../components/Icono';
import { Ventana } from '../../components/Ventana';
import { useToast } from '../../context/ToastContext';
import { useNow } from '../../hooks/useNow';
import { usePagedList } from '../../hooks/usePagedList';
import { errorMessage } from '../../utils/api-error';
import { initials } from '../../utils/format';
import { fechaHora, restanteCorto } from '@studate/shared';

type Pestana = 'dates' | 'planes';

// Dates y Planes del admin, con pestañas como en el Angular del Mínimo 1. Los Dates no se abren ni se
// editan a mano: se ven (con su historial completo), se cierran si hace falta y se eliminan. Los Planes
// del Cambio de Aula se ven, se archivan, se restauran y se eliminan
export function DatesAdmin() {
  const [pestana, setPestana] = useState<Pestana>('dates');

  return (
    <div className="pila">
      <div className="bo-cab">
        <h1 className="t1">Dates y Planes</h1>
      </div>

      <div className="pestanas" role="tablist">
        <button type="button" role="tab" aria-pressed={pestana === 'dates'} onClick={() => setPestana('dates')}>
          Dates
        </button>
        <button type="button" role="tab" aria-pressed={pestana === 'planes'} onClick={() => setPestana('planes')}>
          Planes
        </button>
      </div>

      {pestana === 'dates' ? <TablaDates /> : <TablaPlanes />}
    </div>
  );
}

// Los dos avatares solapados y los nombres de una pareja
function Pareja({ users }: { users: StudateDate['users'] }) {
  return (
    <span className="persona">
      {users.map((u) =>
        u.photo ? <img key={u._id} className="av" src={u.photo} alt="" /> : <span key={u._id} className="ini-av">{initials(u.name)}</span>,
      )}
      <b>{users.map((u) => u.name.split(' ')[0]).join(' y ')}</b>
    </span>
  );
}

function chipEstado(date: StudateDate) {
  const clase = date.status === 'ongoing' ? 'chip azul' : date.status === 'closed' ? 'chip ko' : 'chip';
  return <span className={clase}>{DATE_STATUS_LABELS[date.status]}</span>;
}

const SIN_FILTROS_DATES: DateFilters = { status: '', user: '' };

// ---------------- Dates ----------------
function TablaDates() {
  const { showToast } = useToast();
  const now = useNow(60_000);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<DateFilters>(SIN_FILTROS_DATES);
  const [detalle, setDetalle] = useState<StudateDate | null>(null);
  const [aCerrar, setACerrar] = useState<StudateDate | null>(null);
  const [motivo, setMotivo] = useState('');
  const [aEliminar, setAEliminar] = useState<StudateDate | null>(null);

  const fetcher = useCallback(
    (p: number, f: DateFilters, signal: AbortSignal) => dateService.getDates(p, f, signal),
    [],
  );
  const lista = usePagedList<StudateDate, DateFilters>(fetcher, page, filters);

  const cambiarFiltro = (cambio: Partial<DateFilters>) => {
    setFilters((current) => ({ ...current, ...cambio }));
    setPage(1);
  };

  // Cerrar un Date a mano: queda en el historial con el admin, la hora y el motivo
  const cerrar = async () => {
    if (!aCerrar) {
      return;
    }
    const date = aCerrar;
    setACerrar(null);
    try {
      const updated = await dateService.updateStatus(date._id, 'closed', motivo.trim() || undefined);
      lista.replaceItem(updated);
      showToast('Date cerrado.');
    } catch (err) {
      showToast(errorMessage(err));
    }
    setMotivo('');
  };

  const eliminar = async () => {
    if (!aEliminar) {
      return;
    }
    const date = aEliminar;
    setAEliminar(null);
    try {
      await dateService.deleteDate(date._id);
      showToast('Date eliminado, con su Plan y sus mensajes.');
      lista.reload();
    } catch (err) {
      showToast(errorMessage(err));
    }
  };

  // El turno solo tiene sentido en un Date pendiente; la caducidad, en uno no cerrado
  const turno = (date: StudateDate) =>
    date.status === 'pending' ? (date.users.find((u) => u._id === date.firstTurn)?.name.split(' ')[0] ?? '—') : '—';
  const caduca = (date: StudateDate) =>
    date.status === 'closed'
      ? date.closedReason === 'expired'
        ? 'caducó'
        : '—'
      : date.status === 'pending'
        ? `en ${restanteCorto(remainingMs(date, now))}`
        : '—';

  const acciones = (date: StudateDate) => (
    <div className="acc-fila">
      <button type="button" onClick={() => setDetalle(date)}>
        Ver
      </button>
      {date.status !== 'closed' && (
        <button type="button" onClick={() => setACerrar(date)}>
          Cerrar
        </button>
      )}
      <button type="button" className="peligro" onClick={() => setAEliminar(date)}>
        Eliminar
      </button>
    </div>
  );

  return (
    <>
      <div className="filtros">
        <select aria-label="Estado" value={filters.status} onChange={(e) => cambiarFiltro({ status: e.target.value as DateFilters['status'] })}>
          <option value="">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="ongoing">En curso</option>
          <option value="closed">Cerrados</option>
        </select>
      </div>

      <EstadoLista
        estado={lista.estado}
        error={lista.error}
        onRetry={lista.reload}
        vacio={
          <>
            <b>{filters.status ? 'No hay Dates en ese estado.' : 'Aún no hay ningún Date.'}</b>
            <span className="sua">Se abren solos cuando dos estudiantes se aprueban.</span>
          </>
        }
      >
        <div className="card">
          <div className="tabla-wrap">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Pareja</th>
                  <th>Estado</th>
                  <th>Turno</th>
                  <th>Caduca</th>
                  <th>Abierto</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lista.items.map((date) => (
                  <tr key={date._id}>
                    <td>
                      <Pareja users={date.users} />
                    </td>
                    <td>{chipEstado(date)}</td>
                    <td>{turno(date)}</td>
                    <td>{caduca(date)}</td>
                    <td>{fechaHora(date.createdAt, now)}</td>
                    <td>{acciones(date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="tarjetas-bo">
            {lista.items.map((date) => (
              <div key={date._id} className="card">
                <Pareja users={date.users} />
                <div className="fila">
                  {chipEstado(date)}
                  <span className="sua">
                    {date.status === 'pending' ? `empieza ${turno(date)} · caduca ${caduca(date)}` : fechaHora(date.createdAt, now)}
                  </span>
                </div>
                {acciones(date)}
              </div>
            ))}
          </div>

          <PaginacionBo page={page} pages={lista.pages} total={lista.total} nombre="Dates" onPageChange={setPage} />
        </div>
      </EstadoLista>

      {detalle && <DetalleDate date={detalle} now={now} onClose={() => setDetalle(null)} />}

      {aCerrar && (
        <Ventana label="Cerrar Date" onClose={() => setACerrar(null)}>
          <span className="et">Cerrar Date</span>
          <b className="t-ventana">¿Cerrar el Date de {aCerrar.users.map((u) => u.name.split(' ')[0]).join(' y ')}?</b>
          <span className="sua">Ninguno de los dos podrá seguir escribiendo. Queda en el historial que lo has cerrado tú, cuándo y por qué.</span>
          <div className="campo">
            <label htmlFor="cerrar-motivo">Motivo (opcional)</label>
            <input id="cerrar-motivo" maxLength={200} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Por ejemplo: tras revisar un parte" />
          </div>
          <div className="botonera">
            <button type="button" className="btn2" onClick={() => setACerrar(null)}>
              Cancelar
            </button>
            <button type="button" className="btn peligro" onClick={cerrar}>
              Cerrar Date
            </button>
          </div>
        </Ventana>
      )}

      <ConfirmModal
        open={aEliminar !== null}
        title="¿Eliminar este Date para siempre?"
        message="Se borra con su Plan y todos sus mensajes. Esto no se puede deshacer."
        confirmText="Eliminar"
        onConfirm={eliminar}
        onCancel={() => setAEliminar(null)}
      />
    </>
  );
}

// El detalle de un Date: los datos y su historial completo, con quién hizo cada cambio y cuándo
function DetalleDate({ date, now, onClose }: { date: StudateDate; now: Date; onClose: () => void }) {
  // Quién hizo un cambio: uno de los dos del Date, el admin o el servidor
  const quien = (by?: string) => {
    if (!by) {
      return 'el servidor';
    }
    const user = date.users.find((u) => u._id === by);
    return user ? user.name.split(' ')[0] : 'un admin';
  };

  return (
    <Ventana label="Detalle del Date" onClose={onClose}>
      <span className="et">Date</span>
      <Pareja users={date.users} />
      <div className="fila">
        {chipEstado(date)}
        {date.extended && <span className="chip">Prórroga usada</span>}
        {date.closedReason && <span className="sua">{DATE_CLOSED_REASON_LABELS[date.closedReason]}</span>}
      </div>
      <dl className="datos">
        <dt>Abierto</dt>
        <dd>{fechaHora(date.createdAt, now)}</dd>
        <dt>Empieza</dt>
        <dd>{date.users.find((u) => u._id === date.firstTurn)?.name ?? '—'}</dd>
        <dt>Caduca</dt>
        <dd>{fechaHora(date.expiresAt, now)}</dd>
        {date.startedAt && (
          <>
            <dt>En curso desde</dt>
            <dd>{fechaHora(date.startedAt, now)}</dd>
          </>
        )}
        {date.closedAt && (
          <>
            <dt>Cerrado</dt>
            <dd>{fechaHora(date.closedAt, now)}</dd>
          </>
        )}
      </dl>

      <span className="et">Historial</span>
      <ol className="historial">
        {date.history.map((evento, i) => (
          <li key={i}>
            <span className={evento.status === 'ongoing' ? 'chip azul' : evento.status === 'closed' ? 'chip ko' : 'chip'}>
              {DATE_STATUS_LABELS[evento.status]}
            </span>
            <span>
              {evento.reason ?? 'Cambio de estado'} · por {quien(evento.by)}
              <small>{fechaHora(evento.at, now)}</small>
            </span>
          </li>
        ))}
      </ol>

      <div className="botonera">
        <button type="button" className="btn2" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </Ventana>
  );
}

const SIN_FILTROS_PLANES: PlanFilters = { search: '', status: '', date: '', archived: false };

// ---------------- Planes ----------------
function TablaPlanes() {
  const { showToast } = useToast();
  const now = useNow(60_000);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<PlanFilters>(SIN_FILTROS_PLANES);
  const [detalle, setDetalle] = useState<Plan | null>(null);
  const [pendiente, setPendiente] = useState<{ tipo: 'archivar' | 'restaurar' | 'eliminar'; plan: Plan } | null>(null);

  const fetcher = useCallback(
    (p: number, f: PlanFilters, signal: AbortSignal) => planService.getPlans(p, f, signal),
    [],
  );
  const lista = usePagedList<Plan, PlanFilters>(fetcher, page, filters);

  const cambiarFiltro = (cambio: Partial<PlanFilters>) => {
    setFilters((current) => ({ ...current, ...cambio }));
    setPage(1);
  };

  const confirmar = async () => {
    if (!pendiente) {
      return;
    }
    const { tipo, plan } = pendiente;
    setPendiente(null);
    try {
      if (tipo === 'archivar') {
        await planService.archivePlan(plan._id);
        showToast('Plan archivado.');
      } else if (tipo === 'restaurar') {
        await planService.restorePlan(plan._id);
        showToast('Plan restaurado.');
      } else {
        await planService.deletePlan(plan._id);
        showToast('Plan eliminado para siempre.');
      }
      lista.reload();
    } catch (err) {
      showToast(errorMessage(err));
    }
  };

  const chipPlan = (plan: Plan) => (
    <span className={plan.status === 'confirmed' ? 'chip ok' : plan.status === 'cancelled' ? 'chip ko' : 'chip azul'}>
      {PLAN_STATUS_LABELS[plan.status]}
    </span>
  );

  const sitio = (plan: Plan) => plan.spins.find((s) => s.accepted)?.place ?? `${plan.spins.length} ${plan.spins.length === 1 ? 'tirada' : 'tiradas'}`;

  const acciones = (plan: Plan) => (
    <div className="acc-fila">
      <button type="button" onClick={() => setDetalle(plan)}>
        Ver
      </button>
      {plan.deleted ? (
        <>
          <button type="button" onClick={() => setPendiente({ tipo: 'restaurar', plan })}>
            Restaurar
          </button>
          <button type="button" className="peligro" onClick={() => setPendiente({ tipo: 'eliminar', plan })}>
            Eliminar
          </button>
        </>
      ) : (
        <button type="button" onClick={() => setPendiente({ tipo: 'archivar', plan })}>
          Archivar
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="filtros">
        <label className="buscar">
          <Icono nombre="buscar" />
          <input
            type="search"
            aria-label="Buscar por sitio"
            placeholder="Buscar por sitio"
            value={filters.search}
            onChange={(e) => cambiarFiltro({ search: e.target.value })}
          />
        </label>
        <select aria-label="Estado" value={filters.status} onChange={(e) => cambiarFiltro({ status: e.target.value as PlanFilters['status'] })}>
          <option value="">Todos los estados</option>
          <option value="proposing">Proponiendo</option>
          <option value="confirmed">Confirmados</option>
          <option value="cancelled">Cancelados</option>
        </select>
        <label className="marcar">
          <input type="checkbox" checked={filters.archived} onChange={(e) => cambiarFiltro({ archived: e.target.checked })} />
          Solo archivados
        </label>
      </div>

      <EstadoLista
        estado={lista.estado}
        error={lista.error}
        onRetry={lista.reload}
        vacio={
          <>
            <b>No hay Planes con esos filtros.</b>
            <span className="sua">Un Plan es el Cambio de Aula de un Date: las tiradas de la ruleta y el sitio elegido.</span>
          </>
        }
      >
        <div className="card">
          <div className="tabla-wrap">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Pareja</th>
                  <th>Estado</th>
                  <th>Sitio</th>
                  <th>Creado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lista.items.map((plan) => (
                  <tr key={plan._id}>
                    <td>
                      <Pareja users={plan.date.users} />
                    </td>
                    <td>{chipPlan(plan)}</td>
                    <td>{sitio(plan)}</td>
                    <td>{fechaHora(plan.createdAt, now)}</td>
                    <td>{acciones(plan)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="tarjetas-bo">
            {lista.items.map((plan) => (
              <div key={plan._id} className="card">
                <Pareja users={plan.date.users} />
                <div className="fila">
                  {chipPlan(plan)}
                  <span className="sua">{sitio(plan)}</span>
                </div>
                {acciones(plan)}
              </div>
            ))}
          </div>

          <PaginacionBo page={page} pages={lista.pages} total={lista.total} nombre="Planes" onPageChange={setPage} />
        </div>
      </EstadoLista>

      {detalle && (
        <Ventana label="Detalle del Plan" onClose={() => setDetalle(null)}>
          <span className="et">Plan · Cambio de Aula</span>
          <Pareja users={detalle.date.users} />
          <div className="fila">
            {chipPlan(detalle)}
            {detalle.deleted && <span className="chip ko">Archivado</span>}
          </div>
          <span className="et">Tiradas de la ruleta</span>
          <ol className="historial">
            {detalle.spins.map((spin) => (
              <li key={spin._id}>
                <span className={spin.accepted ? 'chip ok' : 'chip'}>{spin.accepted ? 'Elegida' : 'Tirada'}</span>
                <span>
                  {spin.place} · a {spin.walkingMinutes} min a pie
                  <small>{fechaHora(spin.scheduledAt, now)}</small>
                </span>
              </li>
            ))}
          </ol>
          <div className="botonera">
            <button type="button" className="btn2" onClick={() => setDetalle(null)}>
              Cerrar
            </button>
          </div>
        </Ventana>
      )}

      <ConfirmModal
        open={pendiente !== null}
        title={pendiente?.tipo === 'archivar' ? '¿Archivar este Plan?' : pendiente?.tipo === 'restaurar' ? '¿Restaurar este Plan?' : '¿Eliminar este Plan para siempre?'}
        message={
          pendiente?.tipo === 'eliminar'
            ? 'Esto no se puede deshacer.'
            : pendiente?.tipo === 'archivar'
              ? 'Deja de aparecer. Se puede restaurar.'
              : 'Vuelve a aparecer en la lista.'
        }
        confirmText={pendiente?.tipo === 'archivar' ? 'Archivar' : pendiente?.tipo === 'restaurar' ? 'Restaurar' : 'Eliminar'}
        onConfirm={confirmar}
        onCancel={() => setPendiente(null)}
      />
    </>
  );
}
