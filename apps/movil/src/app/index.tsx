import { useStore } from '@nanostores/react';
import { $user } from '@studate/shared';
import { Redirect } from 'expo-router';

// La raíz de la app: con sesión, a La Orla; sin ella, al login (el layout raíz ya hace lo mismo
// en cualquier otra ruta)
export default function Index() {
  const user = useStore($user);
  return <Redirect href={user ? '/orla' : '/login'} />;
}
