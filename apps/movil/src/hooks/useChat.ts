import { connectChat } from '@studate/shared';
import type { ChatSocket } from '@studate/shared';
import { useEffect, useState } from 'react';

export type EstadoChat = 'conectando' | 'conectado' | 'error';

// Abre el socket del chat mientras la pantalla está montada y lo cierra al salir. Es el mismo hook que
// en la web: el socket (connectChat) es del paquete compartido y aquí solo se gestiona su ciclo de vida
export function useChat() {
  const [socket, setSocket] = useState<ChatSocket | null>(null);
  const [estado, setEstado] = useState<EstadoChat>('conectando');

  useEffect(() => {
    const chat = connectChat();
    const onConnect = () => setEstado('conectado');
    const onDisconnect = () => setEstado('conectando');
    const onError = () => setEstado('error');

    chat.on('connect', onConnect);
    chat.on('disconnect', onDisconnect);
    chat.on('connect_error', onError);
    setSocket(chat);

    return () => {
      chat.off('connect', onConnect);
      chat.off('disconnect', onDisconnect);
      chat.off('connect_error', onError);
      chat.disconnect();
      setSocket(null);
    };
  }, []);

  return { socket, estado };
}

// "Ahora", actualizado cada cierto tiempo, para los relojes de Mis Dates
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
