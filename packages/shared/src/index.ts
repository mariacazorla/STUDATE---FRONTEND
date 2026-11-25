// Punto de entrada de @studate/shared: lo que la web (apps/web) y la app del móvil (apps/movil)
// tienen en común. Las dos lo importan así:
//
//     import { ... } from '@studate/shared';
//
// Regla del paquete: aquí no se pinta nada y no se importa nada del navegador (window, document,
// localStorage) ni de Expo. Lo que cambia de una plataforma a otra se lo pasa cada app desde fuera.
export * from './models';
export * from './services/http';
