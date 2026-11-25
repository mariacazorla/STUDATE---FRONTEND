import type { RefreshTokenStore } from '@studate/shared';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Dónde guarda el móvil el refresh token. La web no lo toca (va en una cookie HttpOnly), pero la app no
// tiene cookies: lo recibe en el JSON del login y lo guarda aquí, en el almacén cifrado del teléfono
// (expo-secure-store: el llavero en iOS y el Keystore en Android). Así, al cerrar y abrir la app, la
// sesión sigue: se pide un access token nuevo con este refresh token (authService.restoreSession).
//
// En el navegador (expo start --web, para probar) no hay almacén cifrado: se usa localStorage, que vale
// para desarrollo pero no es seguro. En un teléfono nunca se llega a ese caso.
const CLAVE = 'studate.refreshToken';

const esWeb = Platform.OS === 'web';

export const sesionStore: RefreshTokenStore = {
  get: async () => {
    if (esWeb) {
      return globalThis.localStorage?.getItem(CLAVE) ?? null;
    }
    return SecureStore.getItemAsync(CLAVE);
  },
  set: async (token) => {
    if (esWeb) {
      globalThis.localStorage?.setItem(CLAVE, token);
      return;
    }
    await SecureStore.setItemAsync(CLAVE, token);
  },
  clear: async () => {
    if (esWeb) {
      globalThis.localStorage?.removeItem(CLAVE);
      return;
    }
    await SecureStore.deleteItemAsync(CLAVE);
  },
};
