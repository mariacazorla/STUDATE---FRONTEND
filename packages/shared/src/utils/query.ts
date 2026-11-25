import type { Paginated } from '../models';

type QueryValue = string | number | boolean | undefined | null;

// Monta la parte de la URL que va detrás de la interrogación: ?page=2&status=pending
// Los valores vacíos ('', undefined, null y false) no se envían: la API valida los filtros con Joi y
// un filtro vacío daría 400. En Angular esto lo hacía HttpParams con un if por cada filtro
export function toQuery(params: Record<string, QueryValue>): string {
  const query = new URLSearchParams();

  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '' && value !== false) {
      query.set(name, String(value));
    }
  }

  const text = query.toString();
  return text ? `?${text}` : '';
}

// Una página tal como la devuelve la API: la lista viene con el nombre del recurso (users, dates...)
export type ApiPage<K extends string, T> = Record<K, T[]> & {
  total: number;
  page: number;
  pages: number;
};

// Pasa la página de la API a la forma común Paginated<T>, con la lista siempre en items
export function toPaginated<K extends string, T>(res: ApiPage<K, T>, key: K): Paginated<T> {
  return { items: res[key], total: res.total, page: res.page, pages: res.pages };
}
