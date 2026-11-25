// Textos de tiempo para Mis Dates y el chat. Son funciones puras: reciben "ahora" para poder probarlas
// y para que el reloj de la pantalla las vuelva a calcular cada medio minuto (hook useNow)

const MINUTO = 60 * 1000;
const HORA = 60 * MINUTO;

// Cuánto queda, en texto corto para el reloj de la lista: "23 h", "45 min", "0 min"
export function restanteCorto(ms: number): string {
  if (ms >= HORA) {
    return `${Math.floor(ms / HORA)} h`;
  }
  return `${Math.floor(ms / MINUTO)} min`;
}

// Cuánto queda, con horas y minutos para el chat: "23 h 12 min", "12 min"
export function restanteLargo(ms: number): string {
  const horas = Math.floor(ms / HORA);
  const minutos = Math.floor((ms % HORA) / MINUTO);
  if (horas === 0) {
    return `${minutos} min`;
  }
  return `${horas} h ${minutos} min`;
}

// La hora de un mensaje: "16:43"
export function horaCorta(iso: string): string {
  const fecha = new Date(iso);
  return `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
}

// Si dos fechas caen en el mismo día del calendario (hora local)
function mismoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// El separador de día del chat: "HOY", "AYER" o la fecha ("12/11/2026")
export function etiquetaDia(iso: string, ahora: Date = new Date()): string {
  const fecha = new Date(iso);
  if (mismoDia(fecha, ahora)) {
    return 'HOY';
  }
  const ayer = new Date(ahora);
  ayer.setDate(ahora.getDate() - 1);
  if (mismoDia(fecha, ayer)) {
    return 'AYER';
  }
  return `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`;
}

// Cuándo empezó una conversación, para la franja del chat: "hoy a las 16:43", "ayer a las 16:43",
// "el 12/11/2026 a las 16:43"
export function empezoEl(iso: string, ahora: Date = new Date()): string {
  const dia = etiquetaDia(iso, ahora);
  const cuando = dia === 'HOY' ? 'hoy' : dia === 'AYER' ? 'ayer' : `el ${dia}`;
  return `${cuando} a las ${horaCorta(iso)}`;
}

// Fecha y hora cortas para las tablas del backoffice: "Hoy, 21:47", "Ayer, 23:10" o "12/11/2026, 10:00"
export function fechaHora(iso: string, ahora: Date = new Date()): string {
  const dia = etiquetaDia(iso, ahora);
  const prefijo = dia === 'HOY' ? 'Hoy' : dia === 'AYER' ? 'Ayer' : dia;
  return `${prefijo}, ${horaCorta(iso)}`;
}

// Hace cuánto pasó algo, para las alertas: "hace un momento", "hace 4 min", "hace 2 h" o la fecha
export function haceCuanto(iso: string, ahora: Date = new Date()): string {
  const ms = ahora.getTime() - new Date(iso).getTime();
  if (ms < MINUTO) {
    return 'hace un momento';
  }
  if (ms < HORA) {
    return `hace ${Math.floor(ms / MINUTO)} min`;
  }
  if (ms < 24 * HORA) {
    return `hace ${Math.floor(ms / HORA)} h`;
  }
  return fechaHora(iso, ahora);
}
