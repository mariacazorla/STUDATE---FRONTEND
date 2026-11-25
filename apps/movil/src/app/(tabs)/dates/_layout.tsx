import { tokens } from '@studate/shared';
import { Stack } from 'expo-router';

// Mis Dates es una pila dentro de su pestaña: la lista y, encima, la conversación de un Date
export default function DatesLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tokens.color.fondo } }} />;
}
