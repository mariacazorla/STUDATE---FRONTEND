import { request } from '@studate/shared';
import { useEffect, useState } from 'react';

import { environment } from '../config/environment';
import { errorMessage, isAbort } from '../utils/api-error';

type Estado = 'comprobando' | 'conectada' | 'error';

// Pantalla de inicio provisional: comprueba que la web habla con la API (GET /ping) a través del
// cliente HTTP de @studate/shared. Las pantallas de verdad llegan con el armazón y el login.
export function Inicio() {
  const [estado, setEstado] = useState<Estado>('comprobando');
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    request<{ hello: string }>('/ping', { signal: controller.signal })
      .then(() => setEstado('conectada'))
      .catch((err) => {
        if (!isAbort(err)) {
          setEstado('error');
          setError(errorMessage(err));
        }
      });

    // Limpieza: si el componente se desmonta, se cancela la petición
    return () => controller.abort();
  }, []);

  return (
    <>
      <h1>Studate</h1>
      <p className="muted">API: {environment.apiUrl}</p>

      {estado === 'comprobando' && <p>Comprobando la conexión con la API...</p>}
      {estado === 'conectada' && <p>La API responde. La web está lista para empezar.</p>}
      {estado === 'error' && <p className="alert">{error}</p>}
    </>
  );
}
