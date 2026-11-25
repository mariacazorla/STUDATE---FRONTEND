import { PAGE_SIZE } from '../models';
import type { CreateReport, Report, ReportSeverity, ReportStatus, ReviewReport } from '../models';
import { toPaginated, toQuery } from '../utils/query';
import type { ApiPage } from '../utils/query';
import { request } from './http';

interface ReportResponse {
  report: Report;
}

// Los filtros del listado de partes del backoffice. Los vacíos no se envían
export interface ReportFilters {
  status: '' | ReportStatus;
  severity: '' | ReportSeverity;
  reported: string;
}

// Los partes (/reports). Mandarlo es del estudiante; listarlos, verlos y revisarlos, solo del admin
// (la API responde 403 a los demás)
export const reportService = {
  /** POST /reports: mandar un parte sobre alguien. Queda abierto para el admin */
  create: (payload: CreateReport) =>
    request<ReportResponse>('/reports', { method: 'POST', body: JSON.stringify(payload) }).then(
      (res) => res.report,
    ),

  /** GET /reports con la página y los filtros (solo admin) */
  getReports: (page: number, filters: ReportFilters, signal?: AbortSignal) =>
    request<ApiPage<'reports', Report>>(
      `/reports${toQuery({
        page,
        limit: PAGE_SIZE,
        status: filters.status,
        severity: filters.severity,
        reported: filters.reported,
      })}`,
      { signal },
    ).then((res) => toPaginated(res, 'reports')),

  /** GET /reports/:id (solo admin) */
  getReport: (id: string, signal?: AbortSignal) =>
    request<ReportResponse>(`/reports/${id}`, { signal }).then((res) => res.report),

  /** PUT /reports/:id/review: revisado o descartado, con la gravedad y lo que se ha hecho (solo admin) */
  review: (id: string, payload: ReviewReport) =>
    request<ReportResponse>(`/reports/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }).then((res) => res.report),
};
