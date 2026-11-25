import { useEffect, useState } from 'react';

// "Ahora", actualizado cada cierto tiempo. Sirve para los relojes de Mis Dates ("quedan 23 h"): el
// componente que lo usa se vuelve a pintar solo cuando toca, sin que cada reloj tenga su temporizador
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
