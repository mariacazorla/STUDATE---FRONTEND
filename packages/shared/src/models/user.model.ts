// Un usuario es quien inicia sesión en Studate. Solo hay dos roles:
//   user   el estudiante: usa La Orla, sus Dates y su perfil
//   admin  el administrador: entra en el backoffice
// No hay un modelo Student aparte: un estudiante es un User con el rol 'user'.
export type UserRole = 'user' | 'admin';

// El texto de cada rol en la pantalla
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  user: 'Estudiante',
  admin: 'Admin',
};

// Un contacto de confianza: alguien de fuera de Studate al que se avisa si el usuario pide ayuda.
// Son opcionales y como mucho 3
export interface TrustedContact {
  name: string;
  email: string;
  phone?: string;
}

export const MAX_TRUSTED_CONTACTS = 3;

// El usuario tal como lo devuelve la API (nunca trae la contraseña).
// GET /users/me solo trae lo básico (_id, name, email y role); el login y el listado del backoffice
// traen también el perfil y el estado de la cuenta. Por eso esos campos son opcionales
export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  birthDate?: string;
  degree?: string;
  lookingFor?: string;
  bio?: string;
  // Foto en base64 ("data:image/jpeg;base64,..."): se puede poner tal cual en el src de una imagen
  photo?: string;
  // Privados: la API no los incluye en el usuario si no se piden a propósito
  trustedContacts?: TrustedContact[];
  // false si un admin lo ha desactivado
  active?: boolean;
  // true si está archivado (borrado lógico)
  deleted?: boolean;
  deletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Así llega un usuario dentro de un voto, un Date, un parte o una alerta: la API lo rellena con
// populate, pero solo con lo necesario para enseñarlo
export interface UserSummary {
  _id: string;
  name: string;
  email: string;
  photo?: string;
}

// Titulaciones de la EETAC que se pueden elegir en los formularios y en el filtro del listado
export const DEGREES = [
  'Grau en Enginyeria Telemàtica',
  'Grau en Enginyeria de Sistemes de Telecomunicació',
  'Grau en Enginyeria Aeroespacial',
  'Grau en Enginyeria de Sistemes Aeroespacials',
];

// Los filtros del listado de usuarios (GET /users). Los vacíos no se envían
export interface UserFilters {
  search: string;
  role: '' | UserRole;
  // '' = todos, 'true' = solo activos, 'false' = solo inactivos (tal cual van en la URL)
  active: '' | 'true' | 'false';
  degree: string;
  archived: boolean;
}

// POST /users: lo que envía el formulario al crear un usuario desde el backoffice.
// A diferencia del registro, el admin elige el rol y si está activo
export interface CreateUser {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  active?: boolean;
  birthDate?: string;
  degree?: string;
  lookingFor?: string;
  bio?: string;
  photo?: string;
}

// PUT /users/:id: lo mismo sin la contraseña (desde el backoffice no se cambia)
export type UpdateUser = Omit<CreateUser, 'password'>;

// GET /users/directory: los demás estudiantes activos, solo con lo que cualquiera puede ver
export interface DirectoryUser {
  _id: string;
  name: string;
  degree?: string;
  photo?: string;
}

// ---- Autenticación ----

// POST /auth/register
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// POST /auth/login
export interface LoginRequest {
  email: string;
  password: string;
}

// En la web el refresh token no viene en el JSON: el backend lo deja en una cookie HttpOnly.
// La app del móvil manda la cabecera X-Client: movil y entonces sí llega aquí
export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

// POST /auth/refresh: un access token nuevo
export interface RefreshResponse {
  token: string;
}
