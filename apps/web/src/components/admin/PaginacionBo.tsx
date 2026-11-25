interface PaginacionBoProps {
  page: number;
  pages: number;
  total: number;
  // "usuarios", "votos", "Dates"...: para decir "Página 1 de 13 · 126 usuarios"
  nombre: string;
  onPageChange: (page: number) => void;
}

// La paginación de las tablas del backoffice: la página y el total, con Anterior y Siguiente.
// Es la del Mínimo 1 con el total al lado, como en la plantilla
export function PaginacionBo({ page, pages, total, nombre, onPageChange }: PaginacionBoProps) {
  return (
    <div className="pag">
      <span>
        Página {page} de {pages} · {total} {nombre}
      </span>
      <div className="btns">
        <button type="button" className="btn2" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Anterior
        </button>
        <button type="button" className="btn2" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
          Siguiente
        </button>
      </div>
    </div>
  );
}
