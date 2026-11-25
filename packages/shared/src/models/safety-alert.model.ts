import type { UserSummary } from './user.model';

// Una alerta de seguridad: el botón de ayuda que un usuario pulsa durante un Date. Avisa al momento a
// los admin y, si el usuario los tiene, a sus contactos de confianza

// De momento solo hay un tipo: el botón de ayuda
export type AlertType = 'sos';

// Abierta (nadie la ha atendido), Atendida o Falsa alarma
export type AlertStatus = 'open' | 'attended' | 'false_alarm';

export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  open: 'Abierta',
  attended: 'Atendida',
  false_alarm: 'Falsa alarma',
};

export interface SafetyAlert {
  _id: string;
  // Quien pide ayuda
  user: UserSummary;
  // Ids del Date o del Plan desde el que se ha pedido, para saber con quién estaba
  date?: string;
  plan?: string;
  type: AlertType;
  // Unas palabras opcionales de quien pide ayuda
  message?: string;
  status: AlertStatus;
  // Qué admin la atendió y cuándo
  attendedBy?: string;
  attendedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// Lo que se envía al pedir ayuda: todo es opcional, porque quien pide ayuda no está para formularios
export interface CreateSafetyAlert {
  date?: string;
  plan?: string;
  message?: string;
}

// Lo que envía el admin al atenderla
export interface AttendSafetyAlert {
  status: 'attended' | 'false_alarm';
}
