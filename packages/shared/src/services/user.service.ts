import { PAGE_SIZE } from '../models';
import type { CreateUser, DirectoryUser, UpdateMyProfile, UpdateUser, User, UserFilters } from '../models';
import { toPaginated, toQuery } from '../utils/query';
import type { ApiPage } from '../utils/query';
import { request } from './http';

interface UserResponse {
  user: User;
}

// Service layer: aquí viven las llamadas a /users. Las pantallas nunca usan fetch directamente.
// Casi todas son de la gestión de usuarios del backoffice, solo para admin (la API responde 403 a
// los demás); getMe y getDirectory las puede usar cualquier usuario con sesión.
// Los métodos que leen reciben un AbortSignal opcional para poder cancelar la petición.
export const userService = {
  /** GET /users/me: el usuario con sesión, con su perfil completo y sus contactos de confianza */
  getMe: (signal?: AbortSignal) =>
    request<UserResponse>('/users/me', { signal }).then((res) => res.user),

  /** PUT /users/me: editar mi perfil (Mi perfil). Devuelve el usuario ya cambiado */
  updateMe: (payload: UpdateMyProfile) =>
    request<UserResponse>('/users/me', { method: 'PUT', body: JSON.stringify(payload) }).then(
      (res) => res.user,
    ),

  /** GET /users/directory: los demás estudiantes activos (cualquier usuario con sesión) */
  getDirectory: (signal?: AbortSignal) =>
    request<{ users: DirectoryUser[] }>('/users/directory', { signal }).then((res) => res.users),

  /** GET /users con la página y los filtros (paginación del servidor). Solo se envían los que tienen valor */
  getUsers: (page: number, filters: UserFilters, signal?: AbortSignal) =>
    request<ApiPage<'users', User>>(
      `/users${toQuery({
        page,
        limit: PAGE_SIZE,
        search: filters.search.trim(),
        role: filters.role,
        active: filters.active,
        degree: filters.degree,
        archived: filters.archived,
      })}`,
      { signal },
    ).then((res) => toPaginated(res, 'users')),

  /** GET /users/:id (también si está inactivo o archivado) */
  getUser: (id: string, signal?: AbortSignal) =>
    request<UserResponse>(`/users/${id}`, { signal }).then((res) => res.user),

  /** POST /users */
  createUser: (payload: CreateUser) =>
    request<UserResponse>('/users', { method: 'POST', body: JSON.stringify(payload) }).then(
      (res) => res.user,
    ),

  /** PUT /users/:id */
  updateUser: (id: string, payload: UpdateUser) =>
    request<UserResponse>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }).then(
      (res) => res.user,
    ),

  /** POST /users/:id/archive: borrado lógico, se puede restaurar */
  archiveUser: (id: string) =>
    request<UserResponse>(`/users/${id}/archive`, { method: 'POST' }).then((res) => res.user),

  /** POST /users/:id/restore */
  restoreUser: (id: string) =>
    request<UserResponse>(`/users/${id}/restore`, { method: 'POST' }).then((res) => res.user),

  /** DELETE /users/:id: borrado físico, solo de usuarios archivados (si no, la API responde 409) */
  deleteUser: (id: string) => request<void>(`/users/${id}`, { method: 'DELETE' }),
};
