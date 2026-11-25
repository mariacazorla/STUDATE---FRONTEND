// En Angular esto eran pipes (truncate, date, uppercase).
// En React no hace falta nada especial: son funciones normales que se llaman dentro del JSX.

export function truncate(value: string | undefined | null, limit = 80, trail = '...'): string {
  if (!value) return '';
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean.length > limit ? clean.substring(0, limit).trim() + trail : clean;
}

// La API manda la fecha con hora en UTC ("2003-02-20T00:00:00.000Z"). Me quedo solo con el día
// y lo reordeno a mano: así la zona horaria no la mueve al día anterior
export function formatDate(iso?: string): string {
  if (!iso) {
    return '';
  }
  const [year, month, day] = iso.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

// La edad a partir de la fecha de nacimiento (ISO). undefined si no hay fecha.
// Resta un año si todavía no ha llegado el cumpleaños de este año
export function edad(birthDate?: string): number | undefined {
  if (!birthDate) {
    return undefined;
  }
  const nacimiento = new Date(birthDate);
  const hoy = new Date();
  let años = hoy.getFullYear() - nacimiento.getFullYear();
  const cumpleEsteAño = new Date(hoy.getFullYear(), nacimiento.getMonth(), nacimiento.getDate());
  if (hoy < cumpleEsteAño) {
    años -= 1;
  }
  return años;
}

// Iniciales para el círculo de quien no tiene foto: primera y última palabra ("Laia Puig" -> "LP")
export function initials(name: string): string {
  const words = name.split(' ').filter((word) => word);
  const first = words[0] ?? '';
  const last = words.length > 1 ? words[words.length - 1] : '';
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}
