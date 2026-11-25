import type { DateStatus } from './date.model';
import type { UserSummary } from './user.model';

// Un Plan es el "Cambio de Aula" del blog: la ruleta propone sitios cerca del campus (las tiradas) a
// la pareja de un Date, y cuando aceptan uno queda el Plan. De momento solo lo gestiona el admin

// Proponiendo (girando la ruleta), Confirmado (hay tirada aceptada) o Cancelado
export type PlanStatus = 'proposing' | 'confirmed' | 'cancelled';

// El texto de cada estado en la pantalla
export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  proposing: 'Proponiendo',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
};

// La ruleta da 3 tiradas al día: un Plan tiene entre 1 y 3 (igual que MAX_SPINS en la API)
export const MAX_SPINS = 3;

// Una tirada tal como la devuelve la API: con su _id
export interface Spin {
  _id: string;
  // El sitio, por ejemplo "Cafetería de la EETAC"
  place: string;
  // Minutos a pie desde el campus
  walkingMinutes: number;
  // Día y hora propuestos, en formato ISO
  scheduledAt: string;
  // Si es el sitio elegido. Como mucho una por Plan
  accepted: boolean;
}

// Una tirada tal como se envía al crear o editar: sin _id (la API no lo acepta y respondería 422)
export type SpinInput = Omit<Spin, '_id'>;

// Así llega el Date dentro de un Plan: la API hace populate del Date y, dentro, de sus dos usuarios
export interface PlanDate {
  _id: string;
  users: UserSummary[];
  status: DateStatus;
  expiresAt: string;
}

export interface Plan {
  _id: string;
  date: PlanDate;
  status: PlanStatus;
  spins: Spin[];
  // Archivado (borrado lógico): se puede restaurar
  deleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// Los filtros del listado (GET /plans). Se pueden combinar; los vacíos no se envían
export interface PlanFilters {
  // Texto que se busca en el sitio de las tiradas
  search: string;
  status: '' | PlanStatus;
  // id del Date: solo su Plan
  date: string;
  // false = activos, true = archivados
  archived: boolean;
}

// POST /plans: el Date, las tiradas y, si se quiere, el estado (si no, Proponiendo)
export interface CreatePlan {
  date: string;
  status?: PlanStatus;
  spins: SpinInput[];
}

// PUT /plans/:id: el estado y las tiradas (el Date de un Plan no se cambia)
export interface UpdatePlan {
  status: PlanStatus;
  spins: SpinInput[];
}
