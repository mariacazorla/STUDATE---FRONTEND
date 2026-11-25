import type { UserSummary } from './user.model';

// Un parte: un usuario avisa de que otro se ha portado mal. Solo lo ven los admin, que lo revisan
// en el backoffice. De momento no hay nada automático: el admin decide qué hacer según la gravedad

// Motivos por los que se puede mandar un parte
export type ReportReason = 'harassment' | 'fake_profile' | 'inappropriate' | 'other';

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  harassment: 'Acoso',
  fake_profile: 'Perfil falso',
  inappropriate: 'Contenido inapropiado',
  other: 'Otro',
};

// Abierto (nadie lo ha mirado), Revisado o Descartado
export type ReportStatus = 'open' | 'reviewed' | 'dismissed';

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: 'Abierto',
  reviewed: 'Revisado',
  dismissed: 'Descartado',
};

// La gravedad la pone el admin al revisarlo, no quien lo manda
export type ReportSeverity = 'low' | 'medium' | 'high';

export const REPORT_SEVERITY_LABELS: Record<ReportSeverity, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

export interface Report {
  _id: string;
  // Quien manda el parte y sobre quién es
  reporter: UserSummary;
  reported: UserSummary;
  // Id del Date, si el parte se mandó desde un chat
  date?: string;
  reason: ReportReason;
  // Comentario de quien manda el parte
  text?: string;
  status: ReportStatus;
  // Lo que rellena el admin al revisarlo
  severity?: ReportSeverity;
  resolution?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// Lo que envía el estudiante al mandar un parte. Quién lo manda lo sabe la API por el token
export interface CreateReport {
  reported: string;
  date?: string;
  reason: ReportReason;
  text?: string;
}

// Lo que envía el admin al revisarlo: no puede volver a dejarlo abierto
export interface ReviewReport {
  status: 'reviewed' | 'dismissed';
  severity?: ReportSeverity;
  resolution?: string;
}
