import { useStore } from '@nanostores/react';
import { $user } from '@studate/shared';
import type { UserRole } from '@studate/shared';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { inicioDe } from '../utils/rutas';

// Las rutas protegidas. En Angular esto eran los guards (authGuard, adminGuard y guestGuard). En
// React Router son componentes que envuelven a un grupo de rutas: si se puede pasar, pintan
// <Outlet /> (la ruta hija); si no, pintan <Navigate />, que cambia de pantalla.
//
// Leen el usuario del store $user con useStore, así que reaccionan solas: al cerrar la sesión (o si
// el refresh token caduca y el cliente HTTP da la sesión por perdida), el usuario pasa a null y la
// pantalla protegida se cambia por el login sin que nadie tenga que navegar a mano.
//
// Ojo: esto solo decide qué pantallas se ven. La seguridad de verdad está en el backend, que
// comprueba el token y el rol en cada petición. Una ruta del frontend se puede saltar desde el navegador.

// Solo para usuarios con sesión. Si no hay sesión, al login, recordando a dónde iba
export function SoloConSesion() {
  const user = useStore($user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <Outlet />;
}

interface SoloRolProps {
  role: UserRole;
}

// Solo para un rol. Va siempre dentro de SoloConSesion. Quien tiene el otro rol vuelve a su pantalla
// de entrada: un estudiante que abre /admin vuelve a La Orla, y un admin que abre /orla, al backoffice
export function SoloRol({ role }: SoloRolProps) {
  const user = useStore($user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== role) {
    return <Navigate to={inicioDe(user.role)} replace />;
  }
  return <Outlet />;
}

// Solo para quien NO tiene sesión (login y registro). Si ya tiene sesión, a su pantalla de entrada
export function SoloSinSesion() {
  const user = useStore($user);

  if (user) {
    return <Navigate to={inicioDe(user.role)} replace />;
  }
  return <Outlet />;
}
