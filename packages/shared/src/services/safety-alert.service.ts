import { PAGE_SIZE } from '../models';
import type { AlertStatus, AttendSafetyAlert, CreateSafetyAlert, SafetyAlert } from '../models';
import { toPaginated, toQuery } from '../utils/query';
import type { ApiPage } from '../utils/query';
import { request } from './http';

interface AlertResponse {
  alert: SafetyAlert;
}

// Las alertas del botón de ayuda (/alerts). Pedir ayuda es del estudiante; listarlas y atenderlas,
// solo del admin, que además las recibe al momento por el socket (alert:new y alert:updated)
export const safetyAlertService = {
  /** POST /alerts: pedir ayuda. Devuelve la alerta y a cuántos contactos de confianza se ha avisado
   *  (0 si no tiene: la alerta se crea igual y la ven los admin) */
  create: (payload: CreateSafetyAlert) =>
    request<{ alert: SafetyAlert; contactsNotified: number }>('/alerts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** GET /alerts con la página y el estado (solo admin) */
  getAlerts: (page: number, status: '' | AlertStatus, signal?: AbortSignal) =>
    request<ApiPage<'alerts', SafetyAlert>>(
      `/alerts${toQuery({ page, limit: PAGE_SIZE, status })}`,
      { signal },
    ).then((res) => toPaginated(res, 'alerts')),

  /** GET /alerts/:id (solo admin) */
  getAlert: (id: string, signal?: AbortSignal) =>
    request<AlertResponse>(`/alerts/${id}`, { signal }).then((res) => res.alert),

  /** PUT /alerts/:id/attend: atendida o falsa alarma (solo admin) */
  attend: (id: string, payload: AttendSafetyAlert) =>
    request<AlertResponse>(`/alerts/${id}/attend`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }).then((res) => res.alert),
};
