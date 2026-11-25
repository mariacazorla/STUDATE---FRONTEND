// Punto de entrada de @studate/shared: lo que la web (apps/web) y la app del móvil (apps/movil)
// tienen en común. Las dos lo importan así:
//
//     import { authService, tokens } from '@studate/shared';
//     import type { User } from '@studate/shared';
//
// Regla del paquete: aquí no se pinta nada y no se importa nada del navegador (window, document,
// localStorage) ni de Expo. Lo que cambia de una plataforma a otra se lo pasa cada app desde fuera
// con configureHttp().

// Modelos: la forma de los datos de la API
export * from './models';

// Cliente HTTP con JWT y servicios de la API
export * from './services/http';
export * from './services/auth.service';
export * from './services/user.service';
export * from './services/grade.service';
export * from './services/date.service';
export * from './services/plan.service';
export * from './services/orla.service';
export * from './services/chat.service';

// La sesión (el usuario que ha entrado)
export * from './stores/session';

// El tema: colores, tipografías, radios, sombras y espacios
export * from './theme/tokens';

// Utilidades
export * from './utils/query';
export * from './utils/dates';
