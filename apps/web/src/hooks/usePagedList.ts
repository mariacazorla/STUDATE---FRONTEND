import type { Paginated } from '@studate/shared';
import { useCallback, useEffect, useState } from 'react';

import { errorMessage, isAbort } from '../utils/api-error';

export type EstadoLista = 'cargando' | 'normal' | 'vacio' | 'error';

// Custom hook de las listas paginadas en el servidor (las del backoffice). Pide una página a la API
// cada vez que cambian la página o los filtros, y da lo necesario para pintar la tabla: los elementos,
// el total, cuántas páginas hay y el estado (cargando, normal, vacío o error).
//
// IMPORTANTE: `fetcher` va en las dependencias del useEffect, así que tiene que ser una función estable
// (una del servicio, o una flecha envuelta en useCallback). Lo mismo con `filters`: el objeto tiene que
// ser el mismo entre renders si no ha cambiado (un useState vale; un literal en cada render, no).
export function usePagedList<T extends { _id: string }, F>(
  fetcher: (page: number, filters: F, signal: AbortSignal) => Promise<Paginated<T>>,
  page: number,
  filters: F,
) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [estado, setEstado] = useState<EstadoLista>('cargando');
  const [error, setError] = useState('');
  // Cambiarlo vuelve a pedir la página (el botón de reintentar y después de borrar)
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setEstado('cargando');

    fetcher(page, filters, controller.signal)
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
        setPages(Math.max(1, res.pages));
        setEstado(res.items.length === 0 ? 'vacio' : 'normal');
      })
      .catch((err) => {
        if (!isAbort(err)) {
          setError(errorMessage(err));
          setEstado('error');
        }
      });

    // Limpieza: al cambiar de página o de filtros se cancela la petición anterior
    return () => controller.abort();
  }, [fetcher, page, filters, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  // Un elemento que ha cambiado (editado, archivado...) sustituye al suyo sin volver a pedir la página
  const replaceItem = useCallback((item: T) => {
    setItems((current) => current.map((it) => (it._id === item._id ? item : it)));
  }, []);

  return { items, total, pages, estado, error, reload, replaceItem };
}
