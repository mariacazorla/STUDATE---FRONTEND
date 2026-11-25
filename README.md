# Studate: frontend

Frontend de [Studate](https://studateapp.blogspot.com/), la app para conocer a gente de tu propia
universidad. Es el proyecto del Grupo 3 de EA (María Cazorla, Diego Soledispa y Miguel Ángel
Quiroga).

En el Sprint 1 este repositorio era el backoffice en Angular. En el Sprint 2 se rehace en React y
pasa a ser un **monorepo**: un solo repositorio con la web, la app del móvil y el código que
comparten. El Angular completo se conserva en el tag `angular-sprint1`
(`git show angular-sprint1:README.md`).

Consume la API de [STUDUDATE---BACKEND](https://github.com/mariacazorla/STUDUDATE---BACKEND).

Las tareas del sprint y la bitácora están en [LOGS.md](LOGS.md); cómo trabajamos (ramas, commits y
comprobaciones), en [CONTRIBUTING.md](CONTRIBUTING.md). El tablero del sprint es el
[GitHub Project de Studate](https://github.com/users/mariacazorla/projects/2).

## Qué hay en cada carpeta

```
STUDATE---FRONTEND/
  package.json         npm workspaces: une las tres carpetas y tiene los comandos comunes
  apps/
    web/               React + Vite: la app del estudiante y el backoffice del admin
    movil/             Expo (React Native): la app del estudiante en el móvil
  packages/
    shared/            Lo que no se pinta: modelos, cliente HTTP con JWT, servicios de la API y tema
  mockups/             Mockups en HTML de las pantallas
```

La web y el móvil son dos frontends distintos, porque una página y una app nativa no se pintan
igual. Pero hablan con la misma API y tienen el mismo aspecto, así que todo lo que no es interfaz se
escribe una sola vez en `packages/shared` y las dos apps lo importan con
`import { ... } from '@studate/shared'`. Si la API cambia, se cambia en un solo sitio.

## Stack tecnológico

| Tecnología | Dónde | Para qué se usa |
|---|---|---|
| [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces) | raíz | Un solo `npm install` para todo y un solo `node_modules` |
| [React](https://react.dev/) 19 | web y móvil | Componentes y hooks |
| [TypeScript](https://www.typescriptlang.org/) 6 | todo | JavaScript con tipos |
| [Vite](https://vite.dev/) | web | Servidor de desarrollo y build |
| [React Router](https://reactrouter.com/) 7 | web | Rutas |
| [Nanostores](https://github.com/nanostores/nanostores) | web y shared | Estado global pequeño (la sesión) |
| [Expo](https://expo.dev/) SDK 57 + Expo Router | móvil | React Native para Android e iOS |
| [Vitest](https://vitest.dev/) | web y shared | Tests |
| [oxlint](https://oxc.rs/docs/guide/usage/linter) y [Prettier](https://prettier.io/) | raíz | Linter y formato, con una sola configuración para todo |

La web parte del Seminario 8 de React y el móvil, del Seminario 8 de React Native, con su misma
forma de programar.

## Requisitos previos

- [Node.js](https://nodejs.org/) 24 LTS (mínimo 22.13, que es lo que pide Expo SDK 57). Con `nvm`,
  `nvm use` lee la versión del fichero `.nvmrc`.
- El backend de Studate arrancado, con su MongoDB.
- Para el móvil: la app [Expo Go](https://expo.dev/go) en el teléfono, en la misma red que el ordenador.

## Cómo arrancarlo

Las dependencias se instalan **siempre desde la raíz**, nunca dentro de una app:

```
npm install
```

| Comando (desde la raíz) | Qué hace |
|---|---|
| `npm run dev:web` | Arranca la web en http://localhost:5173 |
| `npm run dev:movil` | Arranca Expo; el código QR se abre con Expo Go |
| `npm run lint` | Pasa el linter a todo el repositorio |
| `npm run typecheck` | Comprueba los tipos de cada carpeta |
| `npm test` | Pasa los tests de cada carpeta |
| `npm run build` | Compila la web para producción (`apps/web/dist`) |

Para añadir una dependencia a una sola carpeta se indica cuál: `npm install <paquete> --workspace @studate/web`.

## Una sola versión de React

React Native solo funciona con la versión exacta de React para la que está hecho (Expo SDK 57 usa
React 19.2.3), y dos copias de React en el mismo proyecto dan errores al ejecutar. Como en un monorepo
las dependencias se instalan juntas, la web usa esa misma versión, y el `package.json` de la raíz la
fija con `overrides`. Al subir de SDK de Expo se cambia en los tres sitios a la vez: `apps/web`,
`apps/movil` y los `overrides` de la raíz.

## Reglas del código

- `packages/shared` no pinta nada y no importa nada del navegador (`window`, `document`,
  `localStorage`) ni de Expo: lo que cambia de una plataforma a otra se lo pasa cada app desde fuera.
  El linter lo comprueba.
- El tema (colores, tipografías, radios, sombras y espacios) está en un solo fichero de
  `packages/shared`. La web lo convierte en variables CSS y tiene un CSS global; las pantallas solo
  maquetan y no definen colores ni tipografías propias. El móvil usa los mismos valores.
- Las pantallas nunca llaman a `fetch`: usan los servicios de `packages/shared`, que añaden el token
  y lo renuevan cuando caduca.
