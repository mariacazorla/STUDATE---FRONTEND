import type { StudateDate, UserSummary } from '../models';

// Ayudas para leer un Date desde el punto de vista del usuario con sesión ("yo"). Las usan Mis Dates
// y el chat, en la web y en el móvil, para no repetir la misma lógica en cada pantalla.

// La otra persona del Date (la que no soy yo)
export function otherUser(date: StudateDate, meId: string): UserSummary {
  return date.users.find((u) => u._id !== meId) ?? date.users[0];
}

// Si me toca escribir a mí: solo tiene sentido mientras el Date está pendiente, porque el turno es
// para el primer mensaje. Después escriben los dos
export function isMyTurn(date: StudateDate, meId: string): boolean {
  return date.status === 'pending' && date.firstTurn === meId;
}

// Cuánto le queda a un Date pendiente antes de caducar, en milisegundos. Nunca negativo
export function remainingMs(date: StudateDate, now: Date = new Date()): number {
  return Math.max(0, new Date(date.expiresAt).getTime() - now.getTime());
}

// Cambia un Date por su versión nueva dentro de una lista (la que llega por el socket o por la API).
// Si no estaba, lo añade al principio
export function replaceDate(dates: StudateDate[], updated: StudateDate): StudateDate[] {
  const exists = dates.some((d) => d._id === updated._id);
  return exists ? dates.map((d) => (d._id === updated._id ? updated : d)) : [updated, ...dates];
}
