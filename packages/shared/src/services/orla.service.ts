import type { GradeValue, OrlaNext, UndoResult, VoteResult } from '../models';
import { request } from './http';

// Las llamadas de La Orla (/orla), el flujo del estudiante. El "yo" lo pone la API con el token; aquí
// solo se manda a quién se vota y qué nota. Es lo mismo que en el backoffice, pero para el estudiante.
export const orlaService = {
  /** GET /orla/next: el siguiente Expediente y el cupo de A+ de hoy */
  next: (signal?: AbortSignal) => request<OrlaNext>('/orla/next', { signal }),

  /** POST /orla/votes: votar un Expediente. Si es A+ mutuo, la respuesta trae el Date */
  vote: (to: string, value: GradeValue) =>
    request<VoteResult>('/orla/votes', { method: 'POST', body: JSON.stringify({ to, value }) }),

  /** DELETE /orla/votes/:id: deshacer mi último voto (solo dentro de los 10 s) */
  undo: (gradeId: string) => request<UndoResult>(`/orla/votes/${gradeId}`, { method: 'DELETE' }),
};
