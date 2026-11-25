import type { ReactNode } from 'react';

import type { EstadoLista as Estado } from '../../hooks/usePagedList';

interface EstadoListaProps {
  estado: Estado;
  error?: string;
  // Lo que se dice cuando no hay nada, y qué hacer (quitar filtros, por ejemplo)
  vacio: ReactNode;
  onRetry: () => void;
  // La lista en sí, cuando hay datos
  children: ReactNode;
}

// Los cuatro estados de una lista del backoffice en un solo sitio: el esqueleto mientras carga, el
// vacío, el error con reintentar y, si hay datos, lo que le pasen como children
export function EstadoLista({ estado, error, vacio, onRetry, children }: EstadoListaProps) {
  if (estado === 'cargando') {
    return (
      <div className="pila junta" aria-busy="true">
        <span className="esq" style={{ height: 44 }} />
        <span className="esq" style={{ height: 44 }} />
        <span className="esq" style={{ height: 44 }} />
        <span className="esq" style={{ height: 44 }} />
      </div>
    );
  }

  if (estado === 'error') {
    return (
      <div className="vacio">
        <b>No hemos podido cargar la lista.</b>
        <span className="sua">{error || 'La API no responde. Vuelve a probar.'}</span>
        <button type="button" className="btn" onClick={onRetry}>
          Reintentar
        </button>
      </div>
    );
  }

  if (estado === 'vacio') {
    return <div className="vacio">{vacio}</div>;
  }

  return <>{children}</>;
}
