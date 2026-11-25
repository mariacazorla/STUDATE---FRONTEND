import { gradeService, userService } from '@studate/shared';
import type { Grade, GradeFilters } from '@studate/shared';
import { useCallback, useState } from 'react';

import { EstadoLista } from '../../components/admin/EstadoLista';
import { PaginacionBo } from '../../components/admin/PaginacionBo';
import { Persona } from '../../components/admin/Persona';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { useApiList } from '../../hooks/useApiList';
import { useNow } from '../../hooks/useNow';
import { usePagedList } from '../../hooks/usePagedList';
import { errorMessage } from '../../utils/api-error';
import { fechaHora } from '../../utils/tiempo';

const SIN_FILTROS: GradeFilters = { value: '', user: '' };

// La Orla del admin: los votos de los estudiantes, paginados en el servidor, con filtro por nota y por
// persona (los votos en los que vota o es votada). Sin "nuevo voto": con la app del estudiante, el
// admin ya no necesita crear votos a mano; solo revisarlos y, si hace falta, eliminar uno
export function OrlaAdmin() {
  const { showToast } = useToast();
  const now = useNow(60_000);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<GradeFilters>(SIN_FILTROS);
  const [aEliminar, setAEliminar] = useState<Grade | null>(null);

  // Las personas del filtro: los estudiantes activos (la API filtra por su id)
  const directorio = useApiList(userService.getDirectory);

  const fetcher = useCallback(
    (p: number, f: GradeFilters, signal: AbortSignal) => gradeService.getGrades(p, f, signal),
    [],
  );
  const lista = usePagedList<Grade, GradeFilters>(fetcher, page, filters);

  const cambiarFiltro = (cambio: Partial<GradeFilters>) => {
    setFilters((current) => ({ ...current, ...cambio }));
    setPage(1);
  };

  const eliminar = async () => {
    if (!aEliminar) {
      return;
    }
    const grade = aEliminar;
    setAEliminar(null);
    try {
      await gradeService.deleteGrade(grade._id);
      showToast('Voto eliminado.');
      lista.reload();
    } catch (err) {
      showToast(errorMessage(err));
    }
  };

  const chipVoto = (grade: Grade) => (
    <span className={grade.value === 'A+' ? 'chip ok' : 'chip ko'}>{grade.value}</span>
  );

  return (
    <div className="pila">
      <div className="bo-cab">
        <h1 className="t1">La Orla</h1>
        <span className="sua">Votos de los estudiantes</span>
      </div>

      <div className="filtros">
        <select aria-label="Persona" value={filters.user} onChange={(e) => cambiarFiltro({ user: e.target.value })}>
          <option value="">Todas las personas</option>
          {directorio.items.map((u) => (
            <option key={u._id} value={u._id}>
              {u.name}
            </option>
          ))}
        </select>
        <select aria-label="Voto" value={filters.value} onChange={(e) => cambiarFiltro({ value: e.target.value as GradeFilters['value'] })}>
          <option value="">A+ y F</option>
          <option value="A+">Solo A+</option>
          <option value="F">Solo F</option>
        </select>
      </div>

      <EstadoLista
        estado={lista.estado}
        error={lista.error}
        onRetry={lista.reload}
        vacio={
          <>
            <b>No hay votos con esos filtros.</b>
            {(filters.user || filters.value) && (
              <button type="button" className="btn2" onClick={() => cambiarFiltro(SIN_FILTROS)}>
                Quitar filtros
              </button>
            )}
          </>
        }
      >
        <div className="card">
          <div className="tabla-wrap">
            <table className="tabla">
              <thead>
                <tr>
                  <th>De</th>
                  <th>A</th>
                  <th>Voto</th>
                  <th>Cuándo</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lista.items.map((grade) => (
                  <tr key={grade._id}>
                    <td>
                      <Persona user={grade.from} compacta />
                    </td>
                    <td>
                      <Persona user={grade.to} compacta />
                    </td>
                    <td>{chipVoto(grade)}</td>
                    <td>{fechaHora(grade.createdAt, now)}</td>
                    <td>
                      <div className="acc-fila">
                        <button type="button" className="peligro" onClick={() => setAEliminar(grade)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="tarjetas-bo">
            {lista.items.map((grade) => (
              <div key={grade._id} className="card">
                <b>
                  {grade.from.name.split(' ')[0]} → {grade.to.name.split(' ')[0]}
                </b>
                <div className="fila">
                  {chipVoto(grade)}
                  <span className="sua">{fechaHora(grade.createdAt, now)}</span>
                </div>
                <div className="acc-fila">
                  <button type="button" className="peligro" onClick={() => setAEliminar(grade)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <PaginacionBo page={page} pages={lista.pages} total={lista.total} nombre="votos" onPageChange={setPage} />
        </div>
      </EstadoLista>

      <ConfirmModal
        open={aEliminar !== null}
        title="¿Eliminar este voto?"
        message={
          aEliminar
            ? `El ${aEliminar.value} de ${aEliminar.from.name} a ${aEliminar.to.name} desaparece. Si había abierto un Date, el Date se queda.`
            : ''
        }
        confirmText="Eliminar"
        onConfirm={eliminar}
        onCancel={() => setAEliminar(null)}
      />
    </div>
  );
}
