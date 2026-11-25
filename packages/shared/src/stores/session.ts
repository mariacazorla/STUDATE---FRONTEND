import { atom, computed } from 'nanostores';

import type { User } from '../models';

// La sesión: el usuario que ha iniciado sesión, o null si no hay nadie.
// Es estado global con Nanostores, como en el Seminario 8: un `atom` es un valor que vive FUERA de
// los componentes. Cualquier componente (de la web o del móvil) lo lee con useStore($user) y se
// vuelve a pintar solo cuando cambia.
//
// Solo lo cambia el servicio de autenticación (login, logout y recuperar la sesión): las pantallas
// lo leen, pero no hacen $user.set() por su cuenta.
export const $user = atom<User | null>(null);

// computed: se recalculan solos cada vez que cambia el usuario
export const $isLoggedIn = computed($user, (user) => user !== null);
export const $isAdmin = computed($user, (user) => user?.role === 'admin');
