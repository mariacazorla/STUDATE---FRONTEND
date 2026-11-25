// Un mensaje del chat de un Date. Se envía por socket.io y la API lo guarda, para que al volver a
// abrir el Date se vea la conversación
export interface Message {
  _id: string;
  // Id del Date: cada Date es una sala del chat
  date: string;
  // Id de quien lo ha escrito
  from: string;
  text: string;
  // Cuándo lo ha leído la otra persona. Si no viene, todavía no lo ha leído
  readAt?: string;
  createdAt: string;
}

// Longitud máxima de un mensaje (igual que MESSAGE_MAX_LENGTH en la API)
export const MESSAGE_MAX_LENGTH = 1000;

// Lo que se envía al escribir: solo el texto. Quién escribe lo sabe la API por el token
export interface CreateMessage {
  text: string;
}
