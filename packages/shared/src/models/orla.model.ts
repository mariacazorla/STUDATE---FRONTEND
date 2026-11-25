import type { GradeValue } from './grade.model';
import type { StudateDate } from './date.model';

// La Orla es la pantalla del estudiante. Estos son los tipos de sus tres llamadas (ver orla.service).

// El Expediente: lo que se ve de otro estudiante en La Orla. Solo datos públicos, nunca el email.
export interface Expediente {
  _id: string;
  name: string;
  degree?: string;
  lookingFor?: string;
  bio?: string;
  photo?: string;
  birthDate?: string;
}

// GET /orla/next: el siguiente Expediente (o null si no queda nadie) y cuántos A+ me quedan hoy
export interface OrlaNext {
  user: Expediente | null;
  remaining: number;
}

// POST /orla/votes: el voto creado, el Date si se ha formado un A+ mutuo (si no, null) y el cupo que queda.
// grade llega con el id, por si hay que deshacerlo
export interface VoteResult {
  grade: { _id: string; value: GradeValue };
  date: StudateDate | null;
  remaining: number;
}

// DELETE /orla/votes/:id: si se ha borrado también el Date que ese A+ había abierto, y el cupo que queda
export interface UndoResult {
  dateRemoved: boolean;
  remaining: number;
}
