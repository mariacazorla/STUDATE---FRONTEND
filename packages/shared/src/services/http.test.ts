import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ApiError,
  configureHttp,
  getAccessToken,
  onSessionExpired,
  request,
  setAccessToken,
} from './http';

const API = 'http://api.test';

// Una respuesta de la API con su código y su JSON
function json(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), { status });
}

// Sustituye fetch por una función que responde según la ruta y el token que recibe.
// Así el test decide qué contesta "la API" y después puede mirar qué peticiones se han hecho
function mockApi(handler: (path: string, init: RequestInit) => Response) {
  // request() siempre llama a fetch con sus dos argumentos: la URL y las opciones
  const fn = vi.fn(async (url: string, init: RequestInit) => handler(url.replace(API, ''), init));
  vi.stubGlobal('fetch', fn);
  return fn;
}

const authHeader = (init: RequestInit) =>
  (init.headers as Record<string, string> | undefined)?.Authorization;

const callsTo = (fetchMock: ReturnType<typeof mockApi>, path: string) =>
  fetchMock.mock.calls.filter(([url]) => url === `${API}${path}`);

beforeEach(() => {
  // La web: sin almacén de refresh token, con las cookies activadas
  configureHttp({ apiUrl: API, credentials: 'include' });
  setAccessToken(null);
  onSessionExpired(null);
});

afterEach(() => vi.unstubAllGlobals());

describe('request: el token en cada petición', () => {
  it('añade Authorization: Bearer <token> en una ruta protegida', async () => {
    setAccessToken('token-1');
    const fetchMock = mockApi(() => json(200, { ok: true }));

    await request('/users/me');

    expect(authHeader(fetchMock.mock.calls[0][1])).toBe('Bearer token-1');
  });

  it('no añade el token en las rutas públicas (register, login, refresh y logout)', async () => {
    setAccessToken('token-1');
    const fetchMock = mockApi(() => json(200, {}));

    await request('/auth/login', { method: 'POST', body: '{}' });
    await request('/auth/register', { method: 'POST', body: '{}' });
    await request('/auth/logout', { method: 'POST' });

    for (const [, init] of fetchMock.mock.calls) {
      expect(authHeader(init)).toBeUndefined();
    }
  });

  it('un 401 del login no intenta renovar: devuelve el error tal cual', async () => {
    const fetchMock = mockApi(() => json(401, { message: 'Email o contraseña incorrectos' }));

    await expect(request('/auth/login', { method: 'POST', body: '{}' })).rejects.toMatchObject({
      status: 401,
      message: 'Email o contraseña incorrectos',
    });
    expect(callsTo(fetchMock, '/auth/refresh')).toHaveLength(0);
  });
});

describe('request: renovar y reintentar tras un 401', () => {
  it('si el token ha caducado, pide uno nuevo y repite la petición con él', async () => {
    setAccessToken('caducado');
    const fetchMock = mockApi((path, init) => {
      if (path === '/auth/refresh') {
        return json(200, { token: 'nuevo' });
      }
      return authHeader(init) === 'Bearer nuevo'
        ? json(200, { dates: [] })
        : json(401, { message: 'El token ha caducado' });
    });

    const result = await request<{ dates: unknown[] }>('/dates');

    expect(result).toEqual({ dates: [] });
    expect(getAccessToken()).toBe('nuevo');
    expect(callsTo(fetchMock, '/dates')).toHaveLength(2);
    expect(callsTo(fetchMock, '/auth/refresh')).toHaveLength(1);
  });

  it('conserva el método y el body al reintentar', async () => {
    setAccessToken('caducado');
    const fetchMock = mockApi((path, init) => {
      if (path === '/auth/refresh') {
        return json(200, { token: 'nuevo' });
      }
      return authHeader(init) === 'Bearer nuevo' ? json(201, { ok: true }) : json(401, {});
    });

    await request('/grades', { method: 'POST', body: JSON.stringify({ value: 'A+' }) });

    const [, retryInit] = callsTo(fetchMock, '/grades')[1];
    expect(retryInit.method).toBe('POST');
    expect(retryInit.body).toBe('{"value":"A+"}');
  });

  it('tres peticiones con 401 a la vez comparten una sola renovación', async () => {
    setAccessToken('caducado');
    const fetchMock = mockApi((path, init) => {
      if (path === '/auth/refresh') {
        return json(200, { token: 'nuevo' });
      }
      return authHeader(init) === 'Bearer nuevo' ? json(200, {}) : json(401, {});
    });

    await Promise.all([request('/users/me'), request('/dates'), request('/grades')]);

    expect(callsTo(fetchMock, '/auth/refresh')).toHaveLength(1);
  });

  it('si no se puede renovar, se pierde la sesión y se avisa', async () => {
    setAccessToken('caducado');
    const expired = vi.fn();
    onSessionExpired(expired);
    mockApi((path) =>
      path === '/auth/refresh'
        ? json(401, { message: 'Falta el refresh token' })
        : json(401, { message: 'El token ha caducado' }),
    );

    await expect(request('/dates')).rejects.toMatchObject({ status: 401 });

    expect(expired).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
  });

  it('si tras renovar sigue siendo 401, se pierde la sesión y no se reintenta más', async () => {
    setAccessToken('caducado');
    const expired = vi.fn();
    onSessionExpired(expired);
    const fetchMock = mockApi((path) =>
      path === '/auth/refresh'
        ? json(200, { token: 'nuevo' })
        : json(401, { message: 'Tu cuenta no está activa' }),
    );

    await expect(request('/dates')).rejects.toMatchObject({
      status: 401,
      message: 'Tu cuenta no está activa',
    });

    expect(callsTo(fetchMock, '/dates')).toHaveLength(2);
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it('un 403 no renueva nada: hay sesión, pero no permiso', async () => {
    setAccessToken('token-1');
    const fetchMock = mockApi(() => json(403, { message: 'Necesitas el rol admin' }));

    await expect(request('/users')).rejects.toMatchObject({ status: 403 });
    expect(callsTo(fetchMock, '/auth/refresh')).toHaveLength(0);
  });
});

describe('request: la web y el móvil renuevan de forma distinta', () => {
  it('la web manda las cookies y ningún body', async () => {
    const fetchMock = mockApi((path, init) => {
      if (path === '/auth/refresh') {
        return json(200, { token: 'nuevo' });
      }
      return authHeader(init) ? json(200, {}) : json(401, {});
    });

    await request('/users/me');

    const [, refreshInit] = callsTo(fetchMock, '/auth/refresh')[0];
    expect(refreshInit.credentials).toBe('include');
    expect(refreshInit.body).toBeUndefined();
  });

  it('el móvil manda su refresh token guardado en el body y la cabecera X-Client', async () => {
    configureHttp({
      apiUrl: API,
      headers: { 'X-Client': 'movil' },
      refreshTokenStore: {
        get: async () => 'refresh-guardado',
        set: async () => undefined,
        clear: async () => undefined,
      },
    });
    const fetchMock = mockApi((path, init) => {
      if (path === '/auth/refresh') {
        return json(200, { token: 'nuevo' });
      }
      return authHeader(init) ? json(200, {}) : json(401, {});
    });

    await request('/users/me');

    const [, refreshInit] = callsTo(fetchMock, '/auth/refresh')[0];
    expect(refreshInit.body).toBe('{"refreshToken":"refresh-guardado"}');
    expect((refreshInit.headers as Record<string, string>)['X-Client']).toBe('movil');
  });

  it('el móvil sin refresh token guardado no llama a la API y borra la sesión', async () => {
    const clear = vi.fn(async () => undefined);
    configureHttp({
      apiUrl: API,
      refreshTokenStore: { get: async () => null, set: async () => undefined, clear },
    });
    const fetchMock = mockApi(() => json(401, {}));

    await expect(request('/users/me')).rejects.toMatchObject({ status: 401 });

    expect(callsTo(fetchMock, '/auth/refresh')).toHaveLength(0);
    expect(clear).toHaveBeenCalled();
  });
});

describe('request: errores y respuestas sin cuerpo', () => {
  it('lanza ApiError con el message de la API', async () => {
    setAccessToken('token-1');
    mockApi(() => json(409, { message: 'email ya existe' }));

    await expect(request('/users', { method: 'POST', body: '{}' })).rejects.toMatchObject({
      message: 'email ya existe',
      status: 409,
    });
  });

  it('no intenta leer el cuerpo de un 204', async () => {
    setAccessToken('token-1');
    mockApi(() => json(204));

    await expect(request('/users/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('sin conexión lanza ApiError con status 0 y no cierra la sesión', async () => {
    setAccessToken('token-1');
    const expired = vi.fn();
    onSessionExpired(expired);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const error = (await request('/dates').catch((e: unknown) => e)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(expired).not.toHaveBeenCalled();
    expect(getAccessToken()).toBe('token-1');
  });
});
