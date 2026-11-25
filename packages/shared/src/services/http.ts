import type { RefreshResponse } from '../models';

// Error de la API con su código HTTP. status 0 = la petición ni siquiera ha llegado a la API
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// ---- Lo que cambia entre la web y el móvil ----
//
// Este fichero lo usan las dos apps, y cada una guarda el refresh token de una forma:
//
//   - La web no lo toca: el backend lo deja en una cookie HttpOnly, que JavaScript no puede leer.
//     Solo hay que pedirle a fetch que envíe las cookies (credentials: 'include').
//   - La app del móvil no tiene cookies HttpOnly: lo recibe en el JSON del login, lo guarda en el
//     almacén cifrado del teléfono y lo manda en el body de /auth/refresh.
//
// Para no meter aquí nada del navegador ni de Expo, cada app le pasa su "adaptador" al arrancar con
// configureHttp(). Así este código no sabe en qué plataforma está.

// Dónde guarda el refresh token la app del móvil. La web no lo define
export interface RefreshTokenStore {
  get: () => Promise<string | null>;
  set: (token: string) => Promise<void>;
  clear: () => Promise<void>;
}

export interface HttpConfig {
  // Dirección de la API, sin barra al final: http://localhost:1337
  apiUrl: string;
  // La web pone 'include' para que el navegador envíe y acepte la cookie del refresh token
  credentials?: RequestCredentials;
  // Cabeceras que van en todas las peticiones. El móvil pone { 'X-Client': 'movil' }
  headers?: Record<string, string>;
  // Solo en el móvil: el almacén del refresh token
  refreshTokenStore?: RefreshTokenStore;
}

let config: HttpConfig | null = null;

// Cada app llama a esto una vez, antes de hacer ninguna petición
export function configureHttp(newConfig: HttpConfig): void {
  config = newConfig;
}

export function getHttpConfig(): HttpConfig {
  if (!config) {
    throw new Error('Falta llamar a configureHttp() al arrancar la app');
  }
  return config;
}

// ---- El access token ----
//
// Vive solo en memoria, en esta variable. Nunca en localStorage ni en sessionStorage: cualquier
// script que se ejecute en la página (un ataque XSS) podría leerlo. Al recargar la página se pierde,
// y por eso al arrancar se pide uno nuevo con el refresh token (authService.restoreSession).
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

// A quién avisar cuando la sesión se pierde (el refresh token ha caducado o ya no vale).
// Lo registra el servicio de autenticación, que olvida al usuario; las rutas llevan entonces al login
let sessionExpiredListener: (() => void) | null = null;

export function onSessionExpired(listener: (() => void) | null): void {
  sessionExpiredListener = listener;
}

function expireSession(): void {
  accessToken = null;
  // En el móvil se borra también el refresh token guardado. No se espera: da igual si falla
  void config?.refreshTokenStore?.clear().catch(() => undefined);
  sessionExpiredListener?.();
}

// Las únicas rutas que van sin access token: el registro y el login son públicos, y el refresh y el
// logout se identifican con el refresh token. Además, así un 401 del login (contraseña mala) o del
// refresh (sesión caducada) no entra en la lógica de renovar
const PUBLIC_PATHS = ['/auth/register', '/auth/login', '/auth/refresh', '/auth/logout'];

// Una petición cancelada (AbortController) no es un error de verdad
function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

// Lanza la petición con fetch. Si se le pasa un token, añade la cabecera Authorization
async function send(path: string, options: RequestInit, token: string | null): Promise<Response> {
  const { apiUrl, credentials, headers } = getHttpConfig();

  try {
    return await fetch(`${apiUrl}${path}`, {
      ...options,
      credentials,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (err) {
    // Una petición cancelada se deja pasar tal cual
    if (isAbort(err)) {
      throw err;
    }
    // Si no hay red o el backend está apagado, fetch lanza un TypeError
    throw new ApiError('No se puede conectar con la API. ¿Está arrancado el backend?', 0);
  }
}

// A diferencia de axios, fetch NO lanza error con un 404 o un 500: hay que mirar res.ok nosotros
// y leer el { message } que manda el gestor de errores de la API
async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.message ?? `Error ${res.status}`, res.status);
  }

  // Borrar y cerrar sesión responden 204 sin cuerpo: no hay nada que leer con res.json()
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

// ---- Renovar el access token ----

// La renovación que está en marcha, si hay alguna. Si tres peticiones reciben un 401 a la vez
// (una pantalla que pide tres cosas al cargar), las tres esperan a la misma renovación en lugar
// de lanzar tres
let refreshing: Promise<string> | null = null;

// POST /auth/refresh: pide un access token nuevo y lo guarda en memoria.
// La web no envía nada en el body (viaja la cookie); el móvil envía su refresh token guardado
export function refreshAccessToken(): Promise<string> {
  if (!refreshing) {
    refreshing = doRefresh().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

async function doRefresh(): Promise<string> {
  const store = getHttpConfig().refreshTokenStore;
  let body: string | undefined;

  if (store) {
    const refreshToken = await store.get();
    // El móvil sin refresh token guardado no tiene sesión: no hace falta ni preguntar a la API
    if (!refreshToken) {
      throw new ApiError('No hay sesión', 401);
    }
    body = JSON.stringify({ refreshToken });
  }

  const res = await send('/auth/refresh', { method: 'POST', body }, null);
  const data = await parse<RefreshResponse>(res);

  accessToken = data.token;
  return data.token;
}

// ---- La función que usan todos los servicios ----
//
// Capa común de fetch. Hace por los servicios lo que en Angular hacía el interceptor:
//   1. Añade la cabecera Authorization: Bearer <token> a todo salvo a las rutas públicas.
//   2. Si la API responde 401, pide un access token nuevo y repite la petición UNA vez.
//      Si no se puede renovar, la sesión se da por perdida y se avisa para volver al login.
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (PUBLIC_PATHS.includes(path)) {
    return parse<T>(await send(path, options, null));
  }

  const res = await send(path, options, accessToken);

  if (res.status !== 401) {
    return parse<T>(res);
  }

  // 401: el access token ha caducado (dura 15 minutos) o no lo tenemos. Se renueva y se reintenta
  let newToken: string;
  try {
    newToken = await refreshAccessToken();
  } catch (err) {
    // Sin conexión no se sabe si la sesión sigue valiendo: se devuelve el error y no se cierra
    if (err instanceof ApiError && err.status === 0) {
      throw err;
    }
    // El refresh token ha caducado o ya no vale: no hay sesión
    expireSession();
    return parse<T>(res);
  }

  const retry = await send(path, options, newToken);

  // Si con un token recién renovado sigue siendo 401, la cuenta ya no puede entrar
  if (retry.status === 401) {
    expireSession();
  }
  return parse<T>(retry);
}
