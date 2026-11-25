import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

import { SOCKET_TOKEN_EXPIRED } from '../models';
import type { ClientToServerEvents, ServerToClientEvents } from '../models';
import { getAccessToken, getHttpConfig, refreshAccessToken } from './http';

// El socket del chat, con los eventos tipados: socket.emit('date:join', ...) y socket.on('date:message', ...)
// solo admiten los nombres y los payloads del contrato
export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// Dónde está el socket. socket.io no cuelga de /api sino del origen de la API: con una apiUrl absoluta
// (http://localhost:1337) se usa su origen; con una relativa ('/api', detrás de nginx en el servidor)
// se devuelve undefined y socket.io usa el origen de la propia página, donde nginx reenvía /socket.io
function socketUrl(apiUrl: string): string | undefined {
  return /^https?:\/\//.test(apiUrl) ? new URL(apiUrl).origin : undefined;
}

// Abre la conexión del chat. Es el equivalente del ChatService del Seminario 10, en una función:
//   - el access token va en el handshake (auth). Es una función para que cada reconexión mande el token
//     que haya en ese momento, no el que había al abrir
//   - si el servidor rechaza la conexión porque el token ha caducado, se renueva con el refresh token y
//     se vuelve a conectar. Con cualquier otro rechazo (sin sesión, cuenta inactiva) se deja estar: la
//     siguiente petición HTTP cerrará la sesión como siempre
// Quien lo llama se encarga de socket.disconnect() al salir de la pantalla.
export function connectChat(): ChatSocket {
  const url = socketUrl(getHttpConfig().apiUrl);
  const options = {
    auth: (send: (data: { token: string | null }) => void) => send({ token: getAccessToken() }),
    withCredentials: true,
  };

  const socket: ChatSocket = url ? io(url, options) : io(options);

  socket.on('connect_error', (err) => {
    if (err.message === SOCKET_TOKEN_EXPIRED) {
      refreshAccessToken()
        .then(() => socket.connect())
        .catch(() => undefined);
    }
  });

  return socket;
}
