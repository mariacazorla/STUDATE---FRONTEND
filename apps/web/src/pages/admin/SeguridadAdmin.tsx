import {
  ALERT_STATUS_LABELS,
  REPORT_REASON_LABELS,
  REPORT_SEVERITY_LABELS,
  REPORT_STATUS_LABELS,
  dateService,
  reportService,
  safetyAlertService,
} from '@studate/shared';
import type { AlertStatus, Report, ReportFilters, ReportSeverity, SafetyAlert } from '@studate/shared';
import { useCallback, useEffect, useState } from 'react';

import { EstadoLista } from '../../components/admin/EstadoLista';
import { PaginacionBo } from '../../components/admin/PaginacionBo';
import { Persona } from '../../components/admin/Persona';
import { Icono } from '../../components/Icono';
import { Ventana } from '../../components/Ventana';
import { useToast } from '../../context/ToastContext';
import { useChat } from '../../hooks/useChat';
import { useNow } from '../../hooks/useNow';
import { usePagedList } from '../../hooks/usePagedList';
import { errorMessage, isAbort } from '../../utils/api-error';
import { initials, truncate } from '../../utils/format';
import { fechaHora, haceCuanto } from '@studate/shared';

type Pestana = 'alertas' | 'partes';

// Seguridad del admin: las "urgencias". Las alertas del botón de ayuda llegan al momento por el socket
// (el servidor mete a los admin en su sala al conectar) y se marcan como atendidas o falsa alarma; los
// partes se revisan poniendo la gravedad y lo que se ha hecho
export function SeguridadAdmin() {
  const [pestana, setPestana] = useState<Pestana>('alertas');
  const { socket, estado: conexion } = useChat();

  return (
    <div className="pila" style={{ maxWidth: 900 }}>
      <div className="bo-cab">
        <h1 className="t1">Seguridad</h1>
        {conexion === 'error' && <span className="chip ko">Sin conexión en tiempo real</span>}
      </div>

      <div className="pestanas" role="tablist">
        <button type="button" role="tab" aria-pressed={pestana === 'alertas'} onClick={() => setPestana('alertas')}>
          Alertas de ayuda
        </button>
        <button type="button" role="tab" aria-pressed={pestana === 'partes'} onClick={() => setPestana('partes')}>
          Partes
        </button>
      </div>

      {pestana === 'alertas' ? <Alertas socket={socket} /> : <Partes />}
    </div>
  );
}

// ---------------- Alertas de ayuda ----------------
function Alertas({ socket }: { socket: ReturnType<typeof useChat>['socket'] }) {
  const { showToast } = useToast();
  const now = useNow(30_000);
  const [page, setPage] = useState(1);
  // Por defecto, las abiertas: son las que hay que atender
  const [status, setStatus] = useState<'' | AlertStatus>('open');
  // Con quién estaba cada alerta: el Date se pide aparte (la alerta solo trae su id)
  const [conQuien, setConQuien] = useState<Record<string, string>>({});

  const fetcher = useCallback(
    (p: number, f: '' | AlertStatus, signal: AbortSignal) => safetyAlertService.getAlerts(p, f, signal),
    [],
  );
  const lista = usePagedList<SafetyAlert, '' | AlertStatus>(fetcher, page, status);
  const { reload } = lista;

  // Tiempo real: una alerta nueva o atendida por otro admin vuelve a pedir la página, sin recargar
  useEffect(() => {
    if (!socket) {
      return;
    }
    const onNew = (alert: SafetyAlert) => {
      showToast(`${alert.user.name} ha pedido ayuda.`);
      reload();
    };
    socket.on('alert:new', onNew);
    socket.on('alert:updated', reload);
    return () => {
      socket.off('alert:new', onNew);
      socket.off('alert:updated', reload);
    };
  }, [socket, reload, showToast]);

  // Los Dates de las alertas de la página, para decir con quién estaba cada persona
  useEffect(() => {
    const controller = new AbortController();
    const pendientes = lista.items.filter((a) => a.date && !conQuien[a.date]);
    for (const alert of pendientes) {
      dateService
        .getDate(alert.date!, controller.signal)
        .then((date) => {
          const otro = date.users.find((u) => u._id !== alert.user._id);
          setConQuien((current) => ({ ...current, [alert.date!]: otro?.name.split(' ')[0] ?? '?' }));
        })
        .catch((err) => {
          if (!isAbort(err)) {
            setConQuien((current) => ({ ...current, [alert.date!]: '?' }));
          }
        });
    }
    return () => controller.abort();
    // Solo cuando cambian los elementos de la página
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista.items]);

  const atender = async (alert: SafetyAlert, estado: 'attended' | 'false_alarm') => {
    try {
      const updated = await safetyAlertService.attend(alert._id, { status: estado });
      lista.replaceItem(updated);
      showToast(estado === 'attended' ? 'Alerta marcada como atendida.' : 'Marcada como falsa alarma.');
    } catch (err) {
      showToast(errorMessage(err));
    }
  };

  const nombre = (alert: SafetyAlert) => alert.user.name.split(' ')[0];

  return (
    <>
      <div className="filtros">
        <select
          aria-label="Estado"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as '' | AlertStatus);
            setPage(1);
          }}
        >
          <option value="open">Abiertas</option>
          <option value="">Todas</option>
          <option value="attended">Atendidas</option>
          <option value="false_alarm">Falsas alarmas</option>
        </select>
      </div>

      <EstadoLista
        estado={lista.estado}
        error={lista.error}
        onRetry={lista.reload}
        vacio={
          <>
            <b>{status === 'open' ? 'No hay alertas abiertas.' : 'No hay alertas con ese estado.'}</b>
            <span className="sua">Cuando alguien pulse el botón de ayuda, saldrá aquí al momento.</span>
          </>
        }
      >
        <div className="alertas">
          {lista.items.map((alert) => (
            <div key={alert._id} className={`card alerta-c${alert.status === 'open' ? ' abierta' : ''}`}>
              {alert.user.photo ? (
                <img className="av" src={alert.user.photo} alt="" />
              ) : (
                <span className="ini-av">{initials(alert.user.name)}</span>
              )}
              <div>
                <b>
                  {alert.status === 'open'
                    ? `${nombre(alert)} pidió ayuda ${haceCuanto(alert.createdAt, now)}`
                    : `${nombre(alert)} · ${ALERT_STATUS_LABELS[alert.status].toLowerCase()}`}
                </b>
                <p className="sua">
                  {alert.date ? `Date con ${conQuien[alert.date] ?? '…'}` : 'Sin Date'}
                  {alert.message ? ` · «${alert.message}»` : ''}
                  {alert.status !== 'open' && alert.attendedAt ? ` · ${fechaHora(alert.attendedAt, now)}` : ''}
                  {alert.status === 'open' ? ` · ${fechaHora(alert.createdAt, now)}` : ''}
                </p>
              </div>
              {alert.status === 'open' ? (
                <div className="fila">
                  <button type="button" className="btn2" onClick={() => atender(alert, 'false_alarm')}>
                    Falsa alarma
                  </button>
                  <button type="button" className="btn peligro" onClick={() => atender(alert, 'attended')}>
                    <Icono nombre="check" />
                    Marcar atendida
                  </button>
                </div>
              ) : (
                <span className={alert.status === 'attended' ? 'chip ok' : 'chip'}>{ALERT_STATUS_LABELS[alert.status]}</span>
              )}
            </div>
          ))}
          <PaginacionBo page={page} pages={lista.pages} total={lista.total} nombre="alertas" onPageChange={setPage} />
        </div>
      </EstadoLista>
    </>
  );
}

const SIN_FILTROS_PARTES: ReportFilters = { status: '', severity: '', reported: '' };

// ---------------- Partes ----------------
function Partes() {
  const { showToast } = useToast();
  const now = useNow(60_000);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ReportFilters>({ ...SIN_FILTROS_PARTES, status: 'open' });
  const [revisando, setRevisando] = useState<Report | null>(null);

  const fetcher = useCallback(
    (p: number, f: ReportFilters, signal: AbortSignal) => reportService.getReports(p, f, signal),
    [],
  );
  const lista = usePagedList<Report, ReportFilters>(fetcher, page, filters);

  const cambiarFiltro = (cambio: Partial<ReportFilters>) => {
    setFilters((current) => ({ ...current, ...cambio }));
    setPage(1);
  };

  const chipEstado = (report: Report) => (
    <span className={report.status === 'open' ? 'chip ko' : report.status === 'reviewed' ? 'chip ok' : 'chip'}>
      {REPORT_STATUS_LABELS[report.status]}
    </span>
  );
  const chipGravedad = (report: Report) =>
    report.severity ? (
      <span className={report.severity === 'high' ? 'chip ko' : report.severity === 'medium' ? 'chip maiz' : 'chip'}>
        {REPORT_SEVERITY_LABELS[report.severity]}
      </span>
    ) : (
      <span className="sua">—</span>
    );

  return (
    <>
      <div className="filtros">
        <select aria-label="Estado" value={filters.status} onChange={(e) => cambiarFiltro({ status: e.target.value as ReportFilters['status'] })}>
          <option value="open">Abiertos</option>
          <option value="">Todos</option>
          <option value="reviewed">Revisados</option>
          <option value="dismissed">Descartados</option>
        </select>
        <select aria-label="Gravedad" value={filters.severity} onChange={(e) => cambiarFiltro({ severity: e.target.value as ReportFilters['severity'] })}>
          <option value="">Cualquier gravedad</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
      </div>

      <EstadoLista
        estado={lista.estado}
        error={lista.error}
        onRetry={lista.reload}
        vacio={
          <>
            <b>{filters.status === 'open' ? 'No hay partes abiertos.' : 'No hay partes con esos filtros.'}</b>
            <span className="sua">Un parte es lo que manda un estudiante cuando alguien se ha portado mal.</span>
          </>
        }
      >
        <div className="card">
          <div className="tabla-wrap">
            <table className="tabla">
              <thead>
                <tr>
                  <th>De</th>
                  <th>Sobre</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th>Gravedad</th>
                  <th>Cuándo</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lista.items.map((report) => (
                  <tr key={report._id}>
                    <td>
                      <Persona user={report.reporter} compacta />
                    </td>
                    <td>
                      <Persona user={report.reported} compacta />
                    </td>
                    <td>
                      {REPORT_REASON_LABELS[report.reason]}
                      {report.text && <span className="sua" style={{ display: 'block' }}>{truncate(report.text, 60)}</span>}
                    </td>
                    <td>{chipEstado(report)}</td>
                    <td>{chipGravedad(report)}</td>
                    <td>{fechaHora(report.createdAt, now)}</td>
                    <td>
                      <div className="acc-fila">
                        <button type="button" onClick={() => setRevisando(report)}>
                          {report.status === 'open' ? 'Revisar' : 'Ver'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="tarjetas-bo">
            {lista.items.map((report) => (
              <div key={report._id} className="card">
                <b>
                  {report.reporter.name.split(' ')[0]} sobre {report.reported.name.split(' ')[0]}
                </b>
                <span className="sua">
                  {REPORT_REASON_LABELS[report.reason]} · {fechaHora(report.createdAt, now)}
                </span>
                <div className="fila">
                  {chipEstado(report)}
                  {chipGravedad(report)}
                </div>
                <div className="acc-fila">
                  <button type="button" onClick={() => setRevisando(report)}>
                    {report.status === 'open' ? 'Revisar' : 'Ver'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <PaginacionBo page={page} pages={lista.pages} total={lista.total} nombre="partes" onPageChange={setPage} />
        </div>
      </EstadoLista>

      {revisando && (
        <RevisarParte
          report={revisando}
          now={now}
          onClose={() => setRevisando(null)}
          onReviewed={(updated) => {
            setRevisando(null);
            lista.replaceItem(updated);
            showToast('Parte revisado.');
          }}
        />
      )}
    </>
  );
}

// La ventana de revisar un parte: lo que mandó el estudiante y lo que decide el admin (revisado o
// descartado, la gravedad y lo que ha hecho). Queda guardado qué admin lo revisó y cuándo
function RevisarParte({ report, now, onClose, onReviewed }: { report: Report; now: Date; onClose: () => void; onReviewed: (r: Report) => void }) {
  const [status, setStatus] = useState<'reviewed' | 'dismissed'>(report.status === 'dismissed' ? 'dismissed' : 'reviewed');
  const [severity, setSeverity] = useState<'' | ReportSeverity>(report.severity ?? '');
  const [resolution, setResolution] = useState(report.resolution ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const guardar = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await reportService.review(report._id, {
        status,
        ...(severity ? { severity } : {}),
        ...(resolution.trim() ? { resolution: resolution.trim() } : {}),
      });
      onReviewed(updated);
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <Ventana label="Revisar parte" onClose={onClose}>
      <span className="et">Parte · {REPORT_REASON_LABELS[report.reason]}</span>
      <b className="t-ventana">
        {report.reporter.name.split(' ')[0]} sobre {report.reported.name}
      </b>
      <span className="sua">
        {fechaHora(report.createdAt, now)}
        {report.date ? ' · desde un chat' : ''}
        {report.text ? ` · «${report.text}»` : ''}
      </span>
      {report.reviewedAt && (
        <span className="sua">
          Revisado {fechaHora(report.reviewedAt, now)}. Se puede volver a revisar.
        </span>
      )}

      <div className="opciones" role="radiogroup" aria-label="Decisión">
        <label className={status === 'reviewed' ? 'sel' : undefined}>
          <input type="radio" name="decision" checked={status === 'reviewed'} onChange={() => setStatus('reviewed')} />
          Revisado: había motivo y se ha actuado
        </label>
        <label className={status === 'dismissed' ? 'sel' : undefined}>
          <input type="radio" name="decision" checked={status === 'dismissed'} onChange={() => setStatus('dismissed')} />
          Descartado: no había motivo
        </label>
      </div>

      <div className="campo">
        <label htmlFor="parte-gravedad">Gravedad</label>
        <select id="parte-gravedad" value={severity} onChange={(e) => setSeverity(e.target.value as '' | ReportSeverity)}>
          <option value="">Sin gravedad</option>
          <option value="low">Baja</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
        </select>
      </div>

      <div className="campo">
        <label htmlFor="parte-resolucion">Qué se ha hecho</label>
        <textarea
          id="parte-resolucion"
          maxLength={500}
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          placeholder="Por ejemplo: aviso al usuario; si se repite, se desactiva la cuenta"
          style={{ height: 72 }}
        />
      </div>

      {error && <div className="aviso">{error}</div>}

      <div className="botonera">
        <button type="button" className="btn2" onClick={onClose} disabled={saving}>
          Cancelar
        </button>
        <button type="button" className="btn" onClick={guardar} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar revisión'}
        </button>
      </div>
    </Ventana>
  );
}
