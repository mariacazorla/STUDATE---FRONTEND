import { useStore } from '@nanostores/react';
import { $user, DEGREES, USER_ROLE_LABELS, userService } from '@studate/shared';
import type { User, UserFilters } from '@studate/shared';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { EstadoLista } from '../../components/admin/EstadoLista';
import { PaginacionBo } from '../../components/admin/PaginacionBo';
import { Persona } from '../../components/admin/Persona';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Icono } from '../../components/Icono';
import { useToast } from '../../context/ToastContext';
import { usePagedList } from '../../hooks/usePagedList';
import { errorMessage } from '../../utils/api-error';

const SIN_FILTROS: UserFilters = { search: '', role: '', active: '', degree: '', archived: false };

// Qué se está confirmando: archivar, restaurar o eliminar para siempre
type Pendiente = { tipo: 'archivar' | 'restaurar' | 'eliminar'; user: User } | null;

// La gestión de usuarios del backoffice: la lista paginada en el servidor (de 10 en 10) con búsqueda y
// filtros, y las acciones de cada fila (editar, archivar, restaurar y eliminar). Lo mismo que en el
// Angular del Sprint 1, en React y con la piel de Studate. En el móvil, la tabla pasa a tarjetas
export function UsuariosAdmin() {
  const me = useStore($user);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<UserFilters>(SIN_FILTROS);
  // La búsqueda se escribe aquí y pasa a los filtros con un pequeño retraso, para no pedir una página
  // por cada tecla
  const [search, setSearch] = useState('');
  const [pendiente, setPendiente] = useState<Pendiente>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((current) => (current.search === search ? current : { ...current, search }));
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetcher = useCallback(
    (p: number, f: UserFilters, signal: AbortSignal) => userService.getUsers(p, f, signal),
    [],
  );
  const lista = usePagedList<User, UserFilters>(fetcher, page, filters);

  const cambiarFiltro = (cambio: Partial<UserFilters>) => {
    setFilters((current) => ({ ...current, ...cambio }));
    setPage(1);
  };

  const hayFiltros = search || filters.role || filters.active || filters.degree || filters.archived;

  // Las acciones de cada fila, tras confirmar
  const confirmar = async () => {
    if (!pendiente) {
      return;
    }
    const { tipo, user } = pendiente;
    setPendiente(null);
    try {
      if (tipo === 'archivar') {
        await userService.archiveUser(user._id);
        showToast(`${user.name} archivado. Se puede restaurar desde el filtro de archivados.`);
      } else if (tipo === 'restaurar') {
        await userService.restoreUser(user._id);
        showToast(`${user.name} restaurado.`);
      } else {
        await userService.deleteUser(user._id);
        showToast(`${user.name} eliminado para siempre.`);
      }
      lista.reload();
    } catch (err) {
      showToast(errorMessage(err));
    }
  };

  const textoConfirmacion = pendiente
    ? pendiente.tipo === 'archivar'
      ? `${pendiente.user.name} dejará de aparecer y no podrá entrar. Se puede restaurar.`
      : pendiente.tipo === 'restaurar'
        ? `${pendiente.user.name} volverá a aparecer y podrá entrar.`
        : `${pendiente.user.name} se borrará de la base de datos con sus votos, Dates y mensajes. Esto no se puede deshacer.`
    : '';

  // Las acciones de un usuario. Un admin no puede archivarse ni eliminarse a sí mismo (la API da 403)
  const acciones = (user: User) => {
    const soyYo = user._id === me?._id;
    return (
      <div className="acc-fila">
        <button type="button" onClick={() => navigate(`/admin/usuarios/${user._id}`)}>
          Editar
        </button>
        {user.deleted ? (
          <>
            <button type="button" onClick={() => setPendiente({ tipo: 'restaurar', user })}>
              Restaurar
            </button>
            <button type="button" className="peligro" onClick={() => setPendiente({ tipo: 'eliminar', user })}>
              Eliminar
            </button>
          </>
        ) : (
          !soyYo && (
            <button type="button" onClick={() => setPendiente({ tipo: 'archivar', user })}>
              Archivar
            </button>
          )
        )}
      </div>
    );
  };

  const chips = (user: User) => (
    <>
      <span className={user.role === 'admin' ? 'chip maiz' : 'chip azul'}>{USER_ROLE_LABELS[user.role]}</span>
      {user.deleted ? (
        <span className="chip ko">Archivado</span>
      ) : user.active === false ? (
        <span className="chip">Inactivo</span>
      ) : (
        <span className="chip ok">Activo</span>
      )}
    </>
  );

  return (
    <div className="pila">
      <div className="bo-cab">
        <h1 className="t1">Usuarios</h1>
        <button type="button" className="btn" onClick={() => navigate('/admin/usuarios/nuevo')}>
          <Icono nombre="mas" />
          Nuevo usuario
        </button>
      </div>

      <div className="filtros">
        <label className="buscar">
          <Icono nombre="buscar" />
          <input
            type="search"
            aria-label="Buscar por nombre o correo"
            placeholder="Buscar por nombre o correo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select aria-label="Rol" value={filters.role} onChange={(e) => cambiarFiltro({ role: e.target.value as UserFilters['role'] })}>
          <option value="">Todos los roles</option>
          <option value="user">Estudiantes</option>
          <option value="admin">Admins</option>
        </select>
        <select aria-label="Estado" value={filters.active} onChange={(e) => cambiarFiltro({ active: e.target.value as UserFilters['active'] })}>
          <option value="">Activos e inactivos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
        <select aria-label="Titulación" value={filters.degree} onChange={(e) => cambiarFiltro({ degree: e.target.value })}>
          <option value="">Todas las titulaciones</option>
          {DEGREES.map((degree) => (
            <option key={degree} value={degree}>
              {degree}
            </option>
          ))}
        </select>
        <label className="marcar">
          <input type="checkbox" checked={filters.archived} onChange={(e) => cambiarFiltro({ archived: e.target.checked })} />
          Solo archivados
        </label>
      </div>

      <EstadoLista
        estado={lista.estado}
        error={lista.error}
        onRetry={lista.reload}
        vacio={
          <>
            <b>Ningún usuario coincide con los filtros.</b>
            <span className="sua">Quita algún filtro o busca por otra parte del nombre.</span>
            {hayFiltros && (
              <button
                type="button"
                className="btn2"
                onClick={() => {
                  setSearch('');
                  setFilters(SIN_FILTROS);
                  setPage(1);
                }}
              >
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
                  <th>Usuario</th>
                  <th>Titulación</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lista.items.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <Persona user={user} />
                    </td>
                    <td>{user.degree ?? '—'}</td>
                    <td>
                      <span className={user.role === 'admin' ? 'chip maiz' : 'chip azul'}>{USER_ROLE_LABELS[user.role]}</span>
                    </td>
                    <td>
                      {user.deleted ? (
                        <span className="chip ko">Archivado</span>
                      ) : user.active === false ? (
                        <span className="chip">Inactivo</span>
                      ) : (
                        <span className="chip ok">Activo</span>
                      )}
                    </td>
                    <td>{acciones(user)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* En el móvil, las mismas filas como tarjetas */}
          <div className="tarjetas-bo">
            {lista.items.map((user) => (
              <div key={user._id} className="card">
                <Persona user={user} detalle={user.degree ?? user.email} />
                <div className="fila">{chips(user)}</div>
                {acciones(user)}
              </div>
            ))}
          </div>

          <PaginacionBo page={page} pages={lista.pages} total={lista.total} nombre="usuarios" onPageChange={setPage} />
        </div>
      </EstadoLista>

      <ConfirmModal
        open={pendiente !== null}
        title={
          pendiente?.tipo === 'archivar'
            ? `¿Archivar a ${pendiente.user.name}?`
            : pendiente?.tipo === 'restaurar'
              ? `¿Restaurar a ${pendiente.user.name}?`
              : `¿Eliminar a ${pendiente?.user.name} para siempre?`
        }
        message={textoConfirmacion}
        confirmText={pendiente?.tipo === 'archivar' ? 'Archivar' : pendiente?.tipo === 'restaurar' ? 'Restaurar' : 'Eliminar'}
        onConfirm={confirmar}
        onCancel={() => setPendiente(null)}
      />
    </div>
  );
}
