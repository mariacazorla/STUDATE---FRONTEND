import { PAGE_SIZE } from '../models';
import type { CreateGrade, Grade, GradeFilters, GradeValue } from '../models';
import { toPaginated, toQuery } from '../utils/query';
import type { ApiPage } from '../utils/query';
import { request } from './http';

interface GradeResponse {
  grade: Grade;
}

// Las llamadas a los votos de La Orla (/grades). De momento son las del backoffice, solo para admin
export const gradeService = {
  /** GET /grades con la página y los filtros. Solo se envían los filtros que tienen valor */
  getGrades: (page: number, filters: GradeFilters, signal?: AbortSignal) =>
    request<ApiPage<'grades', Grade>>(
      `/grades${toQuery({ page, limit: PAGE_SIZE, value: filters.value, user: filters.user })}`,
      { signal },
    ).then((res) => toPaginated(res, 'grades')),

  /** POST /grades */
  createGrade: (payload: CreateGrade) =>
    request<GradeResponse>('/grades', { method: 'POST', body: JSON.stringify(payload) }).then(
      (res) => res.grade,
    ),

  /** PUT /grades/:id: solo se cambia la nota */
  updateGrade: (id: string, value: GradeValue) =>
    request<GradeResponse>(`/grades/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    }).then((res) => res.grade),

  /** DELETE /grades/:id: borrado físico, un voto no se archiva */
  deleteGrade: (id: string) => request<void>(`/grades/${id}`, { method: 'DELETE' }),
};
