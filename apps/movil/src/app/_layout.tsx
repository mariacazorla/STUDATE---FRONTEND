import { tokens } from '@studate/shared';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Layout raíz de la app (Expo Router): todas las pantallas de src/app se pintan dentro de este Stack.
// Hace el papel del <Layout /> con <Outlet /> de la web.
// El color de fondo sale del tema común de @studate/shared, el mismo que usa la web.
export default function RootLayout() {
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
