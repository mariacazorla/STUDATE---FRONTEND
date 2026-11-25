import type { UserSummary } from './user.model';

// Ojo con el nombre: en la app esto es un "Date" (una cita), pero Date ya es la clase de fechas de
// JavaScript. Si la interfaz se llamara Date, en los ficheros que la usan new Date() dejaría de ser una
// fecha. Por eso se llama StudateDate (en el backend pasa lo mismo y el modelo se importa como DateModel)

// Las bandejas del blog: Pendiente (nadie ha escrito), En curso y Cerrado
export type DateStatus = 'pending' | 'ongoing' | 'closed';

// El texto de cada estado en la pantalla
export const DATE_STATUS_LABELS: Record<DateStatus, string> = {
  pending: 'Pendiente',
  ongoing: 'En curso',
  closed: 'Cerrado',
};

// Por qué se ha cerrado un Date: ha caducado, uno ha bloqueado al otro o lo ha cerrado un admin
export type DateClosedReason = 'expired' | 'blocked' | 'admin';

export const DATE_CLOSED_REASON_LABELS: Record<DateClosedReason, string> = {
  expired: 'Caducado',
  blocked: 'Bloqueo',
  admin: 'Cerrado por un admin',
};

// Una entrada del historial de un Date: un cambio de estado, quién lo hizo y cuándo
export interface DateEvent {
  // El estado al que pasó el Date
  status: DateStatus;
  // Id de quien hizo el cambio. Si no viene, lo hizo el servidor
  by?: string;
  reason?: string;
  at: string;
}

export interface StudateDate {
  _id: string;
  // Los dos usuarios, con su nombre, email y foto (populate)
  users: UserSummary[];
  status: DateStatus;
  // Id del usuario al que el sorteo le ha dado el primer mensaje
  firstTurn: string;
  // Cuándo caduca (24 horas después de abrirse, o 48 con la prórroga)
  expiresAt: string;
  // Si ya se ha usado la prórroga
  extended: boolean;
  // Cuándo pasó a En curso: la hora del primer mensaje
  startedAt?: string;
  // Cuándo se cerró y por qué
  closedAt?: string;
  closedReason?: DateClosedReason;
  // Cada cambio de estado, del más antiguo al más nuevo
  history: DateEvent[];
  createdAt: string;
  updatedAt?: string;
}

// Los filtros del listado (GET /dates). user solo lo puede usar el admin
export interface DateFilters {
  status: '' | DateStatus;
  user: string;
}

// POST /dates: los ids de los dos usuarios
export interface CreateDate {
  users: [string, string];
}
