import { connectChat } from '@studate/shared';
import type { ChatSocket } from '@studate/shared';
import { useEffect, useState } from 'react';

export type EstadoChat = 'conectando' | 'conectado' | 'error';

// Abre el socket del chat mientras la pantalla está montada y lo cierra al salir. Devuelve el socket
// para que los componentes se suscriban a sus eventos (socket.on / socket.off en sus propios efectos)
// y el estado de la conexión, para avisar si se ha perdido.
//
// Es un solo socket por pantalla (Mis Dates): la lista y la conversación comparten la conexión, y el
// servidor sabe en qué salas está cada socket.
export function useChat() {
  const [socket, setSocket] = useState<ChatSocket | null>(null);
  const [estado, setEstado] = useState<EstadoChat>('conectando');
  const [error, setError] = useState('');

  useEffect(() => {
    const chat = connectChat();

    const onConnect = () => {
      setEstado('conectado');
      setError('');
    };
    const onDisconnect = () => setEstado('conectando');
    const onConnectError = (err: Error) => {
      setEstado('error');
      setError(err.message);
    };

    chat.on('connect', onConnect);
    chat.on('disconnect', onDisconnect);
    chat.on('connect_error', onConnectError);
    setSocket(chat);

    return () => {
      chat.off('connect', onConnect);
      chat.off('disconnect', onDisconnect);
      chat.off('connect_error', onConnectError);
      chat.disconnect();
      setSocket(null);
    };
  }, []);

  return { socket, estado, error };
}
