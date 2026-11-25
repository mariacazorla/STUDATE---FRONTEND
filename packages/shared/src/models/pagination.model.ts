// Una página de un listado de la API. La paginación se hace en el servidor: el frontend pide una
// página y la API devuelve solo sus elementos y los totales para pintar el paginador.
//
// La API llama a la lista con el nombre del recurso ({ users, total, page, pages }, { dates, ... }).
// Los servicios la pasan a esta forma común (items) para que las pantallas y los hooks de listas
// sirvan igual para usuarios, votos, Dates o Planes.
export interface Paginated<T> {
  items: T[];
  // Cuántos elementos hay en total con esos filtros
  total: number;
  // La página que se ha pedido (la primera es la 1)
  page: number;
  // Cuántas páginas hay
  pages: number;
}

// Cuántos elementos trae cada página. Es el mismo valor que usa la API por defecto (PAGE_SIZE)
export const PAGE_SIZE = 10;
