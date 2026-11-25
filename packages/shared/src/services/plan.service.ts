import { PAGE_SIZE } from '../models';
import type { CreatePlan, Plan, PlanFilters, UpdatePlan } from '../models';
import { toPaginated, toQuery } from '../utils/query';
import type { ApiPage } from '../utils/query';
import { request } from './http';

interface PlanResponse {
  plan: Plan;
}

// Todas las llamadas a los Planes (/plans) en un solo servicio. Son del backoffice: la API pide el
// token y el rol admin, y responde 401 o 403 a los demás
export const planService = {
  /** GET /plans con la página y los filtros (paginación del servidor). Solo se envían los que tienen valor */
  getPlans: (page: number, filters: PlanFilters, signal?: AbortSignal) =>
    request<ApiPage<'plans', Plan>>(
      `/plans${toQuery({
        page,
        limit: PAGE_SIZE,
        search: filters.search.trim(),
        status: filters.status,
        date: filters.date,
        archived: filters.archived,
      })}`,
      { signal },
    ).then((res) => toPaginated(res, 'plans')),

  /** GET /plans/:id (también si está archivado) */
  getPlan: (id: string, signal?: AbortSignal) =>
    request<PlanResponse>(`/plans/${id}`, { signal }).then((res) => res.plan),

  /** POST /plans (409 si el Date está cerrado o ya tiene Plan) */
  createPlan: (payload: CreatePlan) =>
    request<PlanResponse>('/plans', { method: 'POST', body: JSON.stringify(payload) }).then(
      (res) => res.plan,
    ),

  /** PUT /plans/:id: el estado y las tiradas (409 si está archivado) */
  updatePlan: (id: string, payload: UpdatePlan) =>
    request<PlanResponse>(`/plans/${id}`, { method: 'PUT', body: JSON.stringify(payload) }).then(
      (res) => res.plan,
    ),

  /** POST /plans/:id/archive: borrado lógico, se puede restaurar */
  archivePlan: (id: string) =>
    request<PlanResponse>(`/plans/${id}/archive`, { method: 'POST' }).then((res) => res.plan),

  /** POST /plans/:id/restore */
  restorePlan: (id: string) =>
    request<PlanResponse>(`/plans/${id}/restore`, { method: 'POST' }).then((res) => res.plan),

  /** DELETE /plans/:id: borrado físico, solo si está archivado (409 si no) */
  deletePlan: (id: string) => request<void>(`/plans/${id}`, { method: 'DELETE' }),
};
