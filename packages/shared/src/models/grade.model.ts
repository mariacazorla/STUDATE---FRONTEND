import type { UserSummary } from './user.model';

// Un voto de La Orla: la nota que un usuario (from) le pone al perfil de otro (to).
// A+ es aprobado (me interesa) y F es suspenso. Si dos usuarios se ponen A+, se abre un Date
export type GradeValue = 'A+' | 'F';

export const GRADE_VALUES: GradeValue[] = ['A+', 'F'];

export interface Grade {
  _id: string;
  // Quien vota y a quien, con los datos del usuario (populate)
  from: UserSummary;
  to: UserSummary;
  value: GradeValue;
  createdAt: string;
  updatedAt?: string;
}

// Los filtros del listado (GET /grades). Los vacíos no se envían
export interface GradeFilters {
  value: '' | GradeValue;
  // id del usuario: votos en los que vota o es votado
  user: string;
}

// POST /grades: al crear se envían los ids de los dos usuarios
export interface CreateGrade {
  from: string;
  to: string;
  value: GradeValue;
}
