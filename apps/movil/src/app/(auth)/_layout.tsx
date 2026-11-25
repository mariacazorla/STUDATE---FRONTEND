import { tokens } from '@studate/shared';
import { Stack } from 'expo-router';

// Las pantallas de acceso (login y registro), sin pestañas
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tokens.color.fondo } }} />;
}
