import type { StudateDate } from './date.model';
import type { Message } from './message.model';

// El contrato del chat por socket.io: los mismos eventos que tiene el backend en src/sockets/events.ts.
// Si algo cambia allí, se cambia aquí y lo ven la web y el móvil.
//
// Cada Date es una sala: se entra con date:join y a partir de ahí llega todo lo que pasa en ese Date
// (mensajes, cambios de estado, lecturas) sin recargar.

// Lo que envía el cliente
export interface ClientToServerEvents {
  // Entrar en la sala de un Date (solo pueden los dos usuarios del Date)
  'date:join': (payload: { dateId: string }) => void;
  // Salir de la sala
  'date:leave': (payload: { dateId: string }) => void;
  // Enviar un mensaje. Quién lo escribe lo sabe la API por el token
  'date:message': (payload: { dateId: string; text: string }) => void;
  // He leído los mensajes de la otra persona
  'date:read': (payload: { dateId: string }) => void;
}

// Lo que envía el servidor
export interface ServerToClientEvents {
  // Ya estoy en la sala del Date
  'date:joined': (payload: { dateId: string }) => void;
  // Un mensaje nuevo en un Date en el que estoy (también los míos, ya guardados, con su _id)
  'date:message': (message: Message) => void;
  // El Date ha cambiado (En curso con el primer mensaje, cerrado, prórroga...). Llega entero
  'date:updated': (date: StudateDate) => void;
  // La otra persona ha leído mis mensajes
  'date:read': (payload: { dateId: string; by: string; at: string }) => void;
  // Algo no se ha podido hacer: el texto para enseñar
  'chat:error': (payload: { message: string }) => void;
}

// El mensaje con el que el servidor rechaza la conexión cuando el access token ha caducado: con este
// basta renovar el token y volver a conectar. Con cualquier otro, no hay sesión
export const SOCKET_TOKEN_EXPIRED = 'El token ha caducado';
