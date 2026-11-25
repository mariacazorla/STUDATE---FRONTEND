import { PAGE_SIZE } from '../models';
import type { CreateDate, DateFilters, DateStatus, StudateDate } from '../models';
import { toPaginated, toQuery } from '../utils/query';
import type { ApiPage } from '../utils/query';
import { request } from './http';

interface DateResponse {
  date: StudateDate;
}

// Las llamadas a los Dates (/dates). Las usan el admin (ve todos) y los estudiantes (solo los suyos):
// quién ve qué lo decide la API a partir del token
export const dateService = {
  /** GET /dates con la página y los filtros. Solo se envían los filtros que tienen valor */
  getDates: (page: number, filters: DateFilters, signal?: AbortSignal) =>
    request<ApiPage<'dates', StudateDate>>(
      `/dates${toQuery({ page, limit: PAGE_SIZE, status: filters.status, user: filters.user })}`,
      { signal },
    ).then((res) => toPaginated(res, 'dates')),

  /** GET /dates para Mis Dates: todos los míos de una vez (la API admite hasta 100 por página; un
   *  estudiante no llega), primero los más nuevos. El filtro por estado se hace en la pantalla, que
   *  reparte entre las bandejas */
  getMyDates: (signal?: AbortSignal) =>
    request<ApiPage<'dates', StudateDate>>('/dates?limit=100', { signal }).then((res) =>
      toPaginated(res, 'dates'),
    ),

  /** GET /dates/:id (404 si no existe o es de otros) */
  getDate: (id: string, signal?: AbortSignal) =>
    request<DateResponse>(`/dates/${id}`, { signal }).then((res) => res.date),

  /** POST /dates */
  createDate: (payload: CreateDate) =>
    request<DateResponse>('/dates', { method: 'POST', body: JSON.stringify(payload) }).then(
      (res) => res.date,
    ),

  /** PUT /dates/:id: cambiar de bandeja */
  updateStatus: (id: string, status: DateStatus) =>
    request<DateResponse>(`/dates/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }).then((res) => res.date),

  /** POST /dates/:id/extend: la prórroga, 24 horas más (solo una vez; la segunda, 409) */
  extendDate: (id: string) =>
    request<DateResponse>(`/dates/${id}/extend`, { method: 'POST' }).then((res) => res.date),

  /** DELETE /dates/:id (solo admin) */
  deleteDate: (id: string) => request<void>(`/dates/${id}`, { method: 'DELETE' }),
};
