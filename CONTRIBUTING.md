# Cómo contribuir

Este proyecto lo leen y lo mantienen estudiantes. Cuando haya dos formas de hacer algo,
elegimos la más fácil de entender, aunque no sea la más corta ni la más eficiente.

Las tareas del sprint, quién va por dónde y la bitácora están en [LOGS.md](LOGS.md).

## Ramas

| Rama | Para qué |
|---|---|
| `main` | Versión que se presenta. Nunca se trabaja directamente en ella. |
| `develop` | Rama de integración: aquí llega todo lo terminado y aquí se ve el estado real del proyecto. |
| `feat/<nombre>` | Una por grupo de tareas del plan. Sale de `develop` y vuelve a `develop`. Por ejemplo `feat/estructura` o `feat/web-base`. |
| `fix/<nombre>` | Para arreglar algo que ya estaba en `develop`. |

Para empezar un grupo de tareas:

```
git switch develop
git pull
git switch -c feat/nombre
```

Al terminarlo se une a `develop` con un merge que conserva la rama en el historial
(`git merge --no-ff feat/nombre`). Cuando queremos presentar, `develop` pasa a `main`.

## Commits

Un commit por tarea, en español. El mensaje empieza por el tipo de cambio y dice qué cambia:

| Tipo | Cuándo | Ejemplo |
|---|---|---|
| `feat` | Funcionalidad nueva | `feat: pantalla de login` |
| `fix` | Corrige un fallo | `fix: vuelve al login si el refresh falla` |
| `test` | Solo tests | `test: rutas según el rol` |
| `docs` | Solo documentación | `docs: AI_LOG de la estructura` |
| `chore` | Configuración, dependencias, herramientas | `chore: esqueleto del monorepo` |

## Antes de unir una rama a develop

Desde la raíz del repositorio:

- `npm run lint` termina sin errores.
- `npm run typecheck` y `npm run build` terminan sin errores.
- `npm test` pasa todos los tests.
- El código está formateado con Prettier (`npm run format`, o solo al guardar en VS Code).
- Cada pantalla nueva se ha mirado en ancho de portátil (1366 px) y de móvil (390 px).
- Si el cambio depende de algo del backend (una ruta, la forma de una respuesta, un evento del
  socket), está en el apartado Contrato de [LOGS.md](LOGS.md). Si no está, se habla antes con quien
  lleva el backend.
- Marcas en [LOGS.md](LOGS.md) las tareas que cierras y añades una entrada a la bitácora.
- No subes tu `.env`. Si añades una variable nueva, añádela a su `.env.example`.

## Dónde va cada cosa

- Algo que usan la web y el móvil (un modelo, una llamada a la API, un color): `packages/shared`.
- Una pantalla o un componente de la web: `apps/web`. Del móvil: `apps/movil`.
- Un estilo: en el CSS global de la web (`global.css` o `componentes.css`), con las variables del
  tema. Las pantallas no definen colores ni tipografías propias.
