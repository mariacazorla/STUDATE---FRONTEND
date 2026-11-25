import { useStore } from '@nanostores/react';
import { $user, authService, configureHttp, tokens } from '@studate/shared';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { environment } from '@/config/environment';
import { sesionStore } from '@/config/sesion';

// El cliente HTTP es compartido con la web, así que la app le dice cómo es su plataforma: la URL de la
// API, la cabecera X-Client: movil (con ella el login devuelve el refresh token en el JSON en lugar de
// en una cookie) y dónde se guarda ese refresh token (el almacén cifrado del teléfono)
configureHttp({
  apiUrl: environment.apiUrl,
  headers: { 'X-Client': 'movil' },
  refreshTokenStore: sesionStore,
});

// Layout raíz de la app (Expo Router): todas las pantallas de src/app se pintan dentro de este Stack.
// Hace el papel del <Layout /> con las rutas protegidas de la web:
//   - al arrancar se recupera la sesión con el refresh token guardado, antes de pintar nada
//   - sin sesión, solo se puede estar en (auth) (login y registro); con sesión, en (tabs)
export default function RootLayout() {
  const user = useStore($user);
  const [listo, setListo] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    authService.restoreSession().finally(() => setListo(true));
  }, []);

  // Las rutas protegidas: cada vez que cambia el usuario o la pantalla, se comprueba dónde se puede estar
  useEffect(() => {
    if (!listo) {
      return;
    }
    const enAuth = segments[0] === '(auth)';
    if (!user && !enAuth) {
      router.replace('/login');
    } else if (user && enAuth) {
      router.replace('/orla');
    }
  }, [listo, user, segments, router]);

  if (!listo) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.fondo }}>
        <ActivityIndicator color={tokens.color.rosaBoton} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: tokens.color.fondo },
        }}
      />
    </>
  );
}
