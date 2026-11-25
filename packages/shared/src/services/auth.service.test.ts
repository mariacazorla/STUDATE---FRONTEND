import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { $isAdmin, $user } from '../stores/session';
import { authService } from './auth.service';
import { configureHttp, getAccessToken, request, setAccessToken } from './http';

const API = 'http://api.test';

const laia = { _id: 'u1', name: 'Laia Puig', email: 'laia@example.com', role: 'user' as const };
const admin = { _id: 'a1', name: 'Admin', email: 'admin@example.com', role: 'admin' as const };

function json(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), { status });
}

// "La API" de cada test: una respuesta por ruta
function mockApi(routes: Record<string, () => Response>) {
  const fn = vi.fn(async (url: string, _init: RequestInit) => {
    const route = routes[url.replace(API, '')];
    return route ? route() : json(404, { message: 'Not found' });
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

beforeEach(() => {
  configureHttp({ apiUrl: API, credentials: 'include' });
  setAccessToken(null);
  $user.set(null);
});

afterEach(() => vi.unstubAllGlobals());

describe('authService', () => {
  it('login() guarda el access token en memoria y el usuario en el store', async () => {
    mockApi({ '/auth/login': () => json(200, { token: 'access-1', user: admin }) });

    const user = await authService.login({ email: admin.email, password: 'studate26' });

    expect(user.role).toBe('admin');
    expect(getAccessToken()).toBe('access-1');
    expect($user.get()).toEqual(admin);
    expect($isAdmin.get()).toBe(true);
  });

  it('login() con una contraseña mala lanza el 401 de la API y no deja sesión', async () => {
    mockApi({ '/auth/login': () => json(401, { message: 'Email o contraseña incorrectos' }) });

    await expect(
      authService.login({ email: laia.email, password: 'mala' }),
    ).rejects.toMatchObject({ status: 401, message: 'Email o contraseña incorrectos' });
    expect($user.get()).toBeNull();
  });

  it('en el móvil, login() guarda el refresh token que llega en el JSON', async () => {
    const set = vi.fn(async () => undefined);
    configureHttp({
      apiUrl: API,
      headers: { 'X-Client': 'movil' },
      refreshTokenStore: { get: async () => null, set, clear: async () => undefined },
    });
    mockApi({
      '/auth/login': () => json(200, { token: 'access-1', refreshToken: 'refresh-1', user: laia }),
    });

    await authService.login({ email: laia.email, password: 'studate26' });

    expect(set).toHaveBeenCalledWith('refresh-1');
  });

  it('restoreSession() pide un token nuevo y después el usuario', async () => {
    const fetchMock = mockApi({
      '/auth/refresh': () => json(200, { token: 'access-2' }),
      '/users/me': () => json(200, { user: laia }),
    });

    const user = await authService.restoreSession();

    expect(user).toEqual(laia);
    expect($user.get()).toEqual(laia);
    expect(getAccessToken()).toBe('access-2');
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      `${API}/auth/refresh`,
      `${API}/users/me`,
    ]);
  });

  it('restoreSession() sin refresh token válido deja la app sin sesión y no lanza error', async () => {
    mockApi({ '/auth/refresh': () => json(401, { message: 'Falta el refresh token' }) });

    await expect(authService.restoreSession()).resolves.toBeNull();
    expect($user.get()).toBeNull();
    expect(getAccessToken()).toBeNull();
  });

  it('logout() olvida el token y el usuario, y avisa a la API', async () => {
    setAccessToken('access-1');
    $user.set(laia);
    const fetchMock = mockApi({ '/auth/logout': () => json(204) });

    await authService.logout();

    expect(getAccessToken()).toBeNull();
    expect($user.get()).toBeNull();
    expect(fetchMock.mock.calls[0][0]).toBe(`${API}/auth/logout`);
  });

  it('si el cliente HTTP da la sesión por perdida, el usuario se olvida', async () => {
    setAccessToken('caducado');
    $user.set(laia);
    mockApi({
      '/dates': () => json(401, { message: 'El token ha caducado' }),
      '/auth/refresh': () => json(401, { message: 'Falta el refresh token' }),
    });

    await expect(request('/dates')).rejects.toMatchObject({ status: 401 });

    expect($user.get()).toBeNull();
  });
});
