import type { LoginRequest, LoginResponse, RegisterRequest, User } from '../models';
import { $user } from '../stores/session';
import {
  ApiError,
  getHttpConfig,
  onSessionExpired,
  refreshAccessToken,
  request,
  setAccessToken,
} from './http';

interface UserResponse {
  user: User;
}

// Si el cliente HTTP da la sesión por perdida (no ha podido renovar el token), se olvida al usuario.
// Las rutas protegidas de cada app ven que ya no hay usuario y llevan al login
onSessionExpired(() => $user.set(null));

// Las llamadas a /auth y el estado de la sesión. Es el AuthService de Angular pasado a funciones:
// el access token lo guarda http.ts en memoria y el usuario, el store $user.
export const authService = {
  /** POST /auth/register. No inicia sesión: la API no devuelve token y hay que hacer login */
  register: (data: RegisterRequest) =>
    request<UserResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }).then(
      (res) => res.user,
    ),

  /** POST /auth/login. Si va bien, guarda el access token y el usuario en memoria.
   *  En la web el refresh token llega en una cookie HttpOnly y el navegador la guarda él solo;
   *  en el móvil llega en el JSON y se guarda en su almacén seguro */
  async login(credentials: LoginRequest): Promise<User> {
    const res = await request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (res.refreshToken) {
      await getHttpConfig().refreshTokenStore?.set(res.refreshToken);
    }

    setAccessToken(res.token);
    $user.set(res.user);
    return res.user;
  },

  /** Recupera la sesión al arrancar la app, antes de pintar nada. Como el access token solo está en
   *  memoria, al recargar la página se ha perdido: se pide uno nuevo con el refresh token y después
   *  el usuario con GET /users/me. Si no hay refresh token o ha caducado, no hay sesión y devuelve
   *  null: las rutas llevarán al login */
  async restoreSession(): Promise<User | null> {
    try {
      await refreshAccessToken();
      const { user } = await request<UserResponse>('/users/me');
      $user.set(user);
      return user;
    } catch (err) {
      setAccessToken(null);
      $user.set(null);

      // Solo si la API ha dicho que el refresh token ya no vale se borra el que guarda el móvil.
      // Si simplemente no había conexión, se conserva para volver a intentarlo más tarde
      if (err instanceof ApiError && err.status === 401) {
        await getHttpConfig()
          .refreshTokenStore?.clear()
          .catch(() => undefined);
      }
      return null;
    }
  },

  /** Cierra la sesión: el backend borra la cookie y aquí se olvidan el token y el usuario */
  async logout(): Promise<void> {
    // POST /auth/logout borra la cookie del refresh token. No se espera la respuesta: pase lo que
    // pase, la sesión de este dispositivo se termina aquí
    request<void>('/auth/logout', { method: 'POST' }).catch(() => undefined);

    setAccessToken(null);
    await getHttpConfig()
      .refreshTokenStore?.clear()
      .catch(() => undefined);
    $user.set(null);
  },
};
