# AI_LOG

Herramienta: Claude Code (Anthropic). Modelo: Claude Opus 5.5.

## 1. Limpieza del código del Seminario 7

- **Pregunta:** cómo quitar las pantallas de autores, libros y chat.
- **Prompt:** «Lo mismo que en el backend: esto es el frontend del seminario 7 copiado tal cual. Hay que limpiarlo para Studate: quitar las pantallas de autores, libros y chat y dejar la estructura simple para luego meter lo nuestro. Solo quitar y limpiar. Dime el plan de acción de cómo lo harías.»
- **Incoherencias:** algunos tests usaban `/books` como URL de ejemplo.
- **Solución:** cambiados a `/users`. Mantuvimos paginación, modal de confirmar, selector de vista y utils para reutilizarlos.

## 2. Lista de usuarios

- **Pregunta:** lista paginada con búsqueda y filtros.
- **Prompt:** «Empezamos por la lista de usuarios paginada con búsqueda y filtros. Primero quiero ver cómo está montada la paginación en el backend antes de decidir cómo hacer esto, explícamela. ...Vale, ahora que lo entiendo: quiero 10 usuarios por página y algunos filtros, los más típicos. ¿Qué filtros me sugieres? Dame el plan de acción.»
- **Incoherencias:** propuso filtrar por titulación y la API no tenía ese filtro. En el móvil, el select de titulaciones se salía de la pantalla.
- **Solución:** añadimos el filtro en el backend y limitamos el ancho del select.

## 3. Formulario de usuario

- **Pregunta:** crear y editar usuarios con rol y activo.
- **Prompt:** «Ahora el formulario de usuario: crear, editar, rol y activo. Es básicamente el register que ya tenemos, pero hecho bien y adaptado a los roles. Lo de activo es importante, porque todo lo que venga después tiene que saber si un usuario está activo o no: si no lo está, no puede usar la API. Dame el plan de acción.»
- **Incoherencias:** un usuario desactivado seguía usando la API con su token. El test del formulario navegaba a `/users` sin esa ruta y Vitest daba errores.
- **Solución:** arreglo en `VerifyToken` del backend (el interceptor ya cerraba la sesión con el 401) y una ruta vacía `users` en el test.

## 4. Archivar, restaurar y eliminar

- **Pregunta:** acciones de soft delete y hard delete en la lista.
- **Prompt:** «Ahora archivar, restaurar y eliminar desde el backoffice. Aquí ya hay un poco más de chicha. Como hacemos soft delete, primero se archiva y se puede restaurar; eliminar ya es el hard delete. Cuando quiera eliminar para siempre, que me salga un modal de "¿Estás seguro de que quieres eliminar esto?" y, si le doy, se elimina. ¿Cómo lo harías? Plan de acción.»
- **Incoherencias:** ninguna importante.
- **Solución:** un solo `confirm-modal` para archivar y eliminar, y sin botones en la fila del propio admin.

## 5. Backoffice solo para admin

- **Pregunta:** que el backoffice solo lo use el admin.
- **Prompt:** «Ahora que ya tenemos la zona de usuarios, esto lo tienen que administrar los administradores. Hay que rehacer el backoffice bien hecho: login y guards solo para admin, y adaptarlo a los modelos nuevos. Plan de acción.»
- **Incoherencias:** los tests seguían usando la contraseña del seminario.
- **Solución:** `adminGuard` en todas las rutas del backoffice, la etiqueta "Backoffice" en la barra y los tests con la contraseña nueva.

## 6. Pantallas de La Orla

- **Pregunta:** mockup y pantallas de los votos.
- **Prompt:** «Ahora las pantallas de La Orla (Grade). Antes de programar, hazme un mockup para ver cómo quedaría esta pantalla.» y «Y si luego hay que usarlo desde el teléfono, que esta pantalla sea responsive, que se vea bien en el móvil.»
- **Incoherencias:** puso la ayuda "si los dos se han dado A+, se abre un Date" cuando los Dates todavía no existían.
- **Solución:** la quitamos y la volvimos a poner al hacer los Dates.

## 7. Pantallas de Dates

- **Pregunta:** pantallas de Dates para el admin y para cada usuario.
- **Prompt:** «Las pantallas de Dates, igual que las de La Orla: primero el mockup para verlo, y responsive desde el principio para que se vea en el móvil.»
- **Incoherencias:** una interfaz llamada `Date` tapa el `Date` de JavaScript. Para elegir "con quién", un usuario normal no puede llamar a `GET /users`.
- **Solución:** la interfaz se llama `StudateDate` y se usa `GET /users/directory`, que añadimos en el backend.

# Mínimo 1

### 1. Requisitos del examen

- **Pregunta:** cómo vamos a trabajar durante el Mínimo 1.
- **Prompt:** «Estamos en el examen del mínimo 1 y ahora te paso los requisitos a cumplir. Hay que hacer commits constantes de cada cosa relevante que hagamos. Como lo hemos hecho en AI_LOG hay que registrar los prompts que hagamos en cada repositorio. Primero modificaremos el backend y luego el frontend, yo te dictaré el orden de las cosas. Una cosa que tiene que usarse bien es el JWT: lo que hagamos solo tiene que tener acceso el rol de admin, ya que modificaremos el backoffice, terreno del admin. En cada repositorio ya estamos en la rama develop; por cada feat relevante que hagamos tiene que estar en su propia rama con sus commits, que se acabarán pasando a develop y lo subiré yo a main.»
- **Incoherencias:** ninguna importante.
- **Solución:** una rama `feat/<modelo>` por funcionalidad que sale de `develop` y vuelve a ella con un merge `--no-ff`, sin push y sin tocar `main`. Las rutas nuevas llevan `VerifyToken` + `RequireRole('admin')` en el backend y `adminGuard` en el frontend. Los prompts se registran en `AI_LOG.md` y en `AI_LOG_M1.md`.

### 2. Elección del nuevo modelo

- **Pregunta:** qué modelo nuevo añadir que se relacione con una entidad existente que no sea User y que tenga un vector de subdocumentos con al menos 3 tipos de datos distintos.
- **Prompt:** «Empezaremos a crear un nuevo modelo tanto en el backend como en el frontend. Tienes nuestro blog que explica nuestra idea de proyecto (https://studateapp.blogspot.com/). Ahora me gustaría que me recomendaras un modelo que cumpla con los siguientes requisitos: nuevo modelo con relación a una entidad existente que no sea user. Ha de contener un vector de objetos (subdocumentos) con al menos 3 tipos de datos distintos. Primero decidimos este modelo y una vez lo tengamos claro procederemos a hacer el feat, que lo llamaremos por el nombre del modelo escogido. Y para que no haya dudas, solo trabajaremos dentro del backoffice.»
- **Incoherencias:** el blog no habla de un rol admin: el Plan lo cierran los dos usuarios desde la app. Aquí el que lo gestiona es el admin, desde el backoffice.
- **Solución:** elegimos el modelo `Plan`, que en el blog es el "Cambio de Aula". Va relacionado con `Date` (un Plan por Date) y tiene un vector `spins` con las tiradas de la ruleta: `place` (String), `walkingMinutes` (Number), `scheduledAt` (Date) y `accepted` (Boolean).

### 3. Requisitos totales y plan por feats

- **Pregunta:** qué hay que hacer en total con `Plan` y cómo dividirlo en feats, separando backend y frontend.
- **Prompt:** «Una vez tengamos el modelo Plan (usemos su nombre en inglés) hay que hacer su CRUD completo (hard delete y soft delete incluidos) más lo que sea necesario para realizar el mínimo 1. Hay que hacer la paginación desde el servidor, usando populate en MongoDB para las relaciones. Esto tiene que poder filtrarse con al menos 2 combinaciones a la misma ruta de la lista (uno de texto y otro que sea necesario, que no sea texto). Por supuesto esto tiene que estar correctamente validado con Joi, usando los 400, 422, 404, 409. Ya en el frontend tenemos que añadir un Service nuevo que concentre todas las peticiones. Necesitamos 2 nuevos componentes standalone (lista y formulario/detalles) integrados en una vista existente de la entidad relacionada. Usaremos 3 llamadas del nuevo endpoint, obligatoriamente el listado paginado (paginación de servidor + cerca). Cuando hagamos la parte visual quiero un mockup, un HTML que guardarás en el repo de frontend para ver cómo quedará la página modificada. Dime el plan de acción dividido en feats y qué pertenece al backend y qué al frontend.»
- **Incoherencias:** la vista de Dates la usan el admin y los usuarios normales (la ruta solo tiene `authGuard`), así que los componentes de Plan no pueden ir protegidos por la ruta. Además, borrar un Date para siempre dejaría su Plan huérfano.
- **Solución:** tres feats en el backend (`feat/plan-model`, `feat/plan-list`, `feat/plan-crud`) y cuatro en el frontend (`feat/plan-mockup`, `feat/plan-service`, `feat/plan-list`, `feat/plan-form`). Los componentes van dentro de la vista de Dates, solo con `isAdmin()`, y la API responde 403 a cualquier rol que no sea admin. Al borrar un Date se borra también su Plan.

### 4. B1: modelo Plan (`feat/plan-model`)

- **Pregunta:** cómo es el modelo `Plan`, su validación con Joi y sus datos de ejemplo.
- **Prompt:** «Me parece bien la división. Por cada feat quiero ver el código nuevo que vas a añadir, así validando tu plan de acción por cada feat con mi ok. Para el feat 3 te pediré el mockup HTML que te he mencionado previamente. Venga, empezamos con el B1, dime cuál es el plan de acción (recuerda que quiero ver el código que vamos a implementar).»
- **Incoherencias:** ninguna en el código. Antes de proponerla comprobamos que la regla custom de Joi ("una sola tirada aceptada") da un error con `details`, que el ErrorHandler responde como 422. El permiso de Claude Code bloqueó `npm run seed -- --reset` porque borra la BD, así que lo lancé yo a mano.
- **Solución:** `src/models/Plan.ts` con el subdocumento `Spin` (String, Number, Date, Boolean), los esquemas Joi `plan.create`, `plan.update` y `planList`, y Planes de ejemplo en el seed.

### 5. B2: listado paginado y detalle de Planes (`feat/plan-list`)

- **Pregunta:** cómo listar los Planes paginados desde el servidor, con populate y filtros combinables, solo para admin.
- **Prompt:** «Ya está hecho. Comprueba que está bien, haz los commits, cierras el feat y procedemos al siguiente feat donde me dirás el plan de acción.»
- **Incoherencias:** la búsqueda con regex no ignora los acentos: "cafeteria" no encuentra "Cafetería" (sí lo encuentra "cafe").
- **Solución:** `PlanService.getPlans` hace `find` + populate anidado (Plan, luego Date, luego los dos usuarios) + `skip`/`limit` + `countDocuments`. Los filtros `search`, `status`, `date` y `archived` se combinan en `GET /plans`, y `GET /plans/:planId` devuelve el detalle. Las dos rutas llevan `VerifyToken` + `RequireRole('admin')`.

### 6. B3: CRUD de Planes (`feat/plan-crud`)

- **Pregunta:** cómo crear, editar, archivar, restaurar y eliminar Planes con los códigos 404 y 409 correctos, solo para admin.
- **Prompt:** «Procede, tienes mi ok» (cierre de B2, junto al que Claude propuso el plan de B3) y «OK» (aprobación del plan de B3).
- **Incoherencias:** el borrado físico de un Date dejaba su Plan huérfano: el populate habría devuelto `date: null`. En las pruebas, un `POST /plans` sin body daba 500: Express 5 deja `req.body` en `undefined` y Joi lo da por bueno aunque haya campos `required`. El fallo venía de antes y también afectaba a `POST /grades` y `POST /dates`.
- **Solución:** `PlanService` devuelve `{ error }` y el controlador lo traduce a 404 o 409 con una tabla de mensajes. El Plan se edita con `save()` para que pasen los validadores del modelo. El hard delete solo se permite si el Plan está archivado, y `DateService.deleteDate` elimina también el Plan del Date. `ValidateJoi` valida `req.body ?? {}`, así que una petición sin body responde 422.

### 7. F1: mockup de la vista de Dates con los Planes (`feat/plan-mockup`)

- **Pregunta:** cómo quedará la vista de Dates del admin con los dos componentes nuevos de Plan.
- **Prompt:** «Seed reseteado. Vale, pues entonces móntame ya el mockup de la página que vamos a modificar, así te valido si me parece bien el resultado final.»
- **Incoherencias:** para enseñar en la tabla de Dates qué Date tiene Plan habría que pedir los Planes de cada fila, una petición por Date.
- **Solución:** `mockups/plan-dates.html`, un HTML estático con los estilos y los datos reales del seed. El botón "Plan" de cada Date filtra la lista de Planes por ese Date (`GET /plans?date=`), así que basta con una sola llamada. Los Planes salen en una sección nueva debajo de los Dates (`app-plans-list`), y el formulario y detalle (`app-plan-form`) se abre como panel en la misma vista. Todo solo para el admin.

### 8. F2: modelo y PlanService del frontend (`feat/plan-service`)

- **Pregunta:** cómo concentrar en un solo servicio todas las peticiones a `/plans`.
- **Prompt:** «Tienes mi visto bueno del resultado final, procede.» (validación del mockup; Claude cierra F1 y propone el plan de F2)
- **Incoherencias:** al editar, las tiradas llegan de la API con su `_id`, pero el esquema Joi de la tirada no lo acepta (422). Antes de enviarlas hay que quitarlo.
- **Solución:** `models/plan.model.ts` con los tipos del Plan tal como llega con el populate y el tipo `SpinInput` (la tirada sin `_id`). `services/plan.service.ts` con las 7 llamadas: listado con `search`, `status`, `date` y `archived`, detalle, crear, editar, archivar, restaurar y eliminar. Lleva su spec de Vitest.

### 9. F3: lista de Planes en la vista de Dates (`feat/plan-list`)

- **Pregunta:** cómo integrar un componente standalone con la lista paginada de Planes en la vista de Dates, solo para el admin.
- **Prompt:** «procede» (aprobación de F2; Claude cierra F2 y propone el plan de F3)
- **Incoherencias:** en el mockup, el botón "Plan" de un Date con el Plan archivado saltaba solo a "Archivados". Con datos reales, la API filtra siempre por `archived` y no se sabe de antemano si ese Date tiene el Plan archivado. Además, el spec de `DatesList` del admin fallaría con la petición nueva a `/plans` si no se actualiza.
- **Solución:** `components/plans-list` (standalone) con el buscador, el estado y Activos/Archivados combinados en `GET /plans`, paginación de servidor, populate de la pareja, y archivar, restaurar y eliminar con `confirm-modal`. `DatesList` lo muestra solo si `isAdmin()` y su botón "Plan" le pasa el Date con un `input()`. Si ese Date no tiene un Plan activo, la lista lo dice y avisa de que puede estar en "Archivados".

### 10. F4: formulario y detalle de un Plan (`feat/plan-form`)

- **Pregunta:** cómo crear, editar y ver un Plan con un componente standalone de formulario y detalle, con las tiradas como lista dinámica.
- **Prompt:** «procede» (aprobación de F3; Claude implementa F3, la prueba contra la API real y propone el plan de F4)
- **Incoherencias:** en la prueba real de F3, la barra de filtros heredaba el `justify-content: space-between` global y separaba los controles (lo corregimos). Para F4: el `<input type="datetime-local">` trabaja en hora local sin zona y la API guarda ISO en UTC, así que hay que convertir en los dos sentidos. Además, al editar las tiradas llegan con `_id` y Joi no lo acepta. En la prueba real, al eliminar un Date la lista de Planes seguía mostrando su Plan (que la API ya había borrado en cascada) porque `DatesList` no avisaba a `PlansList`.
- **Solución:** `components/plan-form` (standalone) con formulario reactivo: `FormArray` de tiradas (de 1 a 3) y un validador de grupo con las mismas reglas que Joi (una sola aceptada; confirmado con aceptada). Pide el detalle con `GET /plans/:id`, crea con `POST` y edita con `PUT` enviando `SpinInput` sin `_id`. Un Plan archivado se ve en solo lectura. `plans-list` lo abre con "Nuevo Plan", "Editar" y "Ver", y recarga la página al guardar. Al eliminar un Date, `DatesList` quita el filtro de ese Date o recarga la lista de Planes (con `viewChild`).

### 11. Formato de Prettier en dates-list (`fix/dates-list-format`)

- **Pregunta:** dejar con el formato de Prettier los ficheros de la vista de Dates que hemos tocado.
- **Prompt:** «Arregla lo del formato como un fix.»
- **Incoherencias:** en el frontend había 22 ficheros que ya no cumplían Prettier antes del examen. Solo 3 (los de `dates-list`) se han tocado en el Mínimo 1.
- **Solución:** `prettier --write` solo en `dates-list.ts`, `.html` y `.spec.ts`, en su propia rama de fix. Comprobamos que, quitando espacios, saltos de línea y comas finales, el contenido es idéntico (solo cambia el formato). Los tests, el lint y el build siguen igual. Los otros 19 ficheros no se tocan para no mezclar cambios ajenos al examen.

# Sprint 2

Modelo en el Sprint 2: Claude Fable 5.2.

### 1. Estructura: fuera el Angular y esqueleto del monorepo (`feat/estructura`)

- **Pregunta:** cómo pasar el repo del backoffice en Angular a un monorepo con la web en React, la app del móvil y lo compartido, sin perder el historial.
- **Prompt:** «Según la planificación establecida previamente, vamos a proceder de esta forma. Empezamos por la estructura, que es la base de todo. Las tareas son las del bloque 1 del plan (de la 1 a la 15). [...] Después el frontend. Hay que quitar todo lo de Angular y hacer limpieza, pero se quedan los AI_LOG y el historial de git, porque tiene que haber continuidad. Luego el esqueleto del monorepo: la web, el móvil y lo compartido. La web y el móvil tienen que tener el mismo estilo visual, el del blog, así que el tema va en un solo sitio, y desde el principio quiero usar bien el CSS global, para ir logrando un estilo unificado y no crear cosas únicas por página. En lo compartido van los modelos, el cliente HTTP con JSON Web Token para absolutamente todo y los servicios de la API: es pasar lo que teníamos en Angular a React. La web se hace a partir del Seminario 8 de React y programando con su mismo estilo; al menos en estos primeros pasos, es básicamente adaptar el Seminario 8 a lo nuestro. Los roles son solo dos: administrador y estudiante. Las cosas se hacen por feats: una rama por grupo de tareas, como en el Mínimo 1, y un commit por tarea. Dime el plan de acción.» Después de ver el plan lo aprobamos tal cual («procede») y le pedimos que, si salía alguna incompatibilidad que no hubiéramos tenido en cuenta, la dejara bien resuelta pensando en el futuro.
- **Incoherencias:**
  - El Seminario 8 de React pide React `^19.2.8` y el de React Native fija React `19.2.3`, que es la versión exacta que necesita Expo SDK 57. En un monorepo las dependencias se instalan juntas, y dos copias de React dan errores al ejecutar.
  - El plan ponía la app del móvil en esta rama, pero tiene que arrancar leyendo el tema de `packages/shared`, que se hace en la rama siguiente.
  - El plan decía Node 22 en el `.nvmrc`; el backend ya usa Node 24 y Expo SDK 57 pide 22.13 como mínimo.
- **Solución:**
  - Tag `angular-sprint1` en el último commit con Angular y un commit que solo borra: código, configuración, GUIA y EJERCICIO. Se quedan el historial, los AI_LOG, el LOGS y el mockup.
  - `package.json` raíz con npm workspaces (`apps/*` y `packages/*`) y los comandos comunes (`dev:web`, `dev:movil`, `lint`, `typecheck`, `test` y `build`); `.nvmrc` con Node 24; `.gitignore`, Prettier y oxlint con una sola configuración para todo; y `packages/shared` como paquete vacío.
  - React se fija a `19.2.3` en la raíz con `overrides`, para que la web y el móvil usen la misma copia.
  - Una regla del linter prohíbe `window`, `document` y `localStorage` dentro de `packages/shared`, porque ese código también se ejecuta en el móvil.
  - La app del móvil pasa a su propia rama (`feat/movil-base`), después de `feat/shared`.

### 2. Lo compartido: modelos, cliente HTTP con JWT, servicios y tema (`feat/shared`)

- **Pregunta:** cómo pasar a React lo que teníamos en Angular (modelos, interceptor del JWT y servicios) de forma que lo usen igual la web y la app del móvil.
- **Prompt:** el mismo del bloque de estructura (entrada anterior). De esta rama es la parte: «En lo compartido van los modelos, el cliente HTTP con JSON Web Token para absolutamente todo y los servicios de la API: es pasar lo que teníamos en Angular a React. [...] La web y el móvil tienen que tener el mismo estilo visual, el del blog, así que el tema va en un solo sitio.»
- **Incoherencias:**
  - El interceptor de Angular decidía si renovar el token comparando el mensaje del 401 con el texto "El token ha caducado". Al recargar la página (sin token en memoria) el mensaje es otro y se cerraba la sesión.
  - El refresh token se guarda distinto en cada plataforma (cookie HttpOnly en la web, almacén cifrado en el móvil), pero `packages/shared` no puede importar nada del navegador ni de Expo.
  - Cada listado de la API llama a su lista con un nombre distinto (`users`, `dates`, `plans`...), y así un hook de listas no sirve para todos.
  - Sin conexión, el refresh falla igual que con una sesión caducada: tratarlos igual cerraría la sesión por un corte de red.
- **Solución:**
  - Modelos en TypeScript de los ocho modelos del backend y `Paginated<T>`. El estudiante es un `User` con rol `user`.
  - `http.ts` con la forma del `request()` del Seminario 8 y lo que hacía el interceptor: el access token solo en memoria, `Authorization` en todo salvo registro, login, refresh y logout, y ante cualquier 401 una sola renovación en curso (compartida por las peticiones que fallen a la vez) y un reintento. Si no se puede renovar, se avisa de que la sesión se ha perdido. Un fallo de red devuelve un error con `status 0` y no cierra la sesión.
  - Lo que cambia entre plataformas va en un adaptador que cada app pasa con `configureHttp()`: la web pone `credentials: 'include'`; el móvil, la cabecera `X-Client: movil` y un almacén para el refresh token.
  - Servicios de `auth`, `users`, `grades`, `dates` y `plans`, que devuelven los listados como `Paginated<T>`. La sesión (el usuario) vive en un store de Nanostores, `$user`.
  - `tokens.ts` con los colores, tipografías, radios, sombras y espacios del blog.
  - Tests con Vitest: 15 del cliente HTTP (token en cada petición, renovar y reintentar, una sola renovación, sesión perdida, web y móvil) y 7 del servicio de autenticación.

### 3. La app del móvil, vacía y con el tema común (`feat/movil-base`)

- **Pregunta:** cómo meter el proyecto de Expo del Seminario 8 de React Native en el monorepo y que arranque con el mismo tema que la web.
- **Prompt:** el mismo del bloque de estructura (entrada 1). De esta rama es la parte: «Luego el esqueleto del monorepo: la web, el móvil y lo compartido. La web y el móvil tienen que tener el mismo estilo visual, el del blog, así que el tema va en un solo sitio.»
- **Incoherencias:**
  - El plan preveía un `metro.config.js` preparado para el monorepo. La documentación de Expo dice que desde el SDK 52 Metro se configura solo en un monorepo, y que una configuración manual antigua hay que quitarla.
  - `npm install` fallaba: una dependencia indirecta de Expo Router (`@expo-google-fonts/material-symbols`) tiene publicada la versión 0.4.55 sin su fichero, y npm respondía 404.
  - El proyecto del seminario trae pantallas de autores, libros, permisos y teoría, y dependencias que solo usan esas pantallas.
- **Solución:**
  - `apps/movil` con lo mínimo del proyecto del seminario: `app.json`, Expo Router y una pantalla de inicio. Sin `metro.config.js`.
  - Esa dependencia se fija en los `overrides` de la raíz a la 0.4.49, que es la que usa el proyecto del seminario.
  - La pantalla de inicio pinta la marca y los colores con `tokens` de `@studate/shared`: ni un color escrito a mano. La URL de la API se lee de `EXPO_PUBLIC_API_URL`.
  - Comprobado sin teléfono: `expo export` empaqueta la app para web y para Android dentro del monorepo, `expo install --check` da las versiones por buenas y solo hay una copia de React (19.2.3) y de React Native. Queda por verla en un teléfono con Expo Go.

### 4. La web: base, CSS global, armazón, login y rutas por rol (`feat/web-base`)

- **Pregunta:** cómo montar la web a partir del Seminario 8 de React, con un CSS global que salga del tema, y dejarla entrando con JWT según el rol.
- **Prompt:** el mismo del bloque de estructura (entrada 1). De esta rama es la parte: «Desde el principio quiero usar bien el CSS global, para ir logrando un estilo unificado y no crear cosas únicas por página. [...] La web se hace a partir del Seminario 8 de React y programando con su mismo estilo; al menos en estos primeros pasos, es básicamente adaptar el Seminario 8 a lo nuestro. Los roles son solo dos: administrador y estudiante.»
- **Incoherencias:**
  - El diseño acordado usa "container queries" para pasar de móvil a escritorio, porque dentro del documento cada pantalla va en un marco. En la web real el marco es la ventana.
  - El hook `useListControls` del seminario busca y pagina en el navegador, y nuestro requisito es paginar en el servidor.
  - El registro del diseño pide fecha de nacimiento y titulación y comprueba el dominio de la universidad, pero la API solo acepta nombre, correo y contraseña.
  - Las clases de los componentes del seminario (`.modal`, `.toast`, `.pagination`) venían de su hoja de estilos, que tiene sus propios colores.
  - En las pruebas en el navegador: una rejilla dejaba que la página se desbordara a lo ancho en el móvil, y una regla del menú lateral cortaba las iniciales del usuario.
- **Solución:**
  - `apps/web` con la estructura del seminario (components, context, hooks, utils y config), sin autores, libros ni favoritos y sin `useListControls`. La URL de la API se lee de `VITE_API_URL`.
  - `aplicarTema()` vuelca los tokens como variables CSS antes del primer render. Todo el estilo vive en `global.css` y `componentes.css`, con `@media (min-width: 900px)` y sin un color escrito a mano. Los componentes del seminario se han pasado a esas clases y `/estilos` las enseña todas.
  - Un solo componente `Armazon` para el estudiante y el admin: menú lateral en escritorio y, en estrecho, pestañas abajo o fila de secciones. `NavLink` marca la página activa con `aria-current`.
  - Login y registro con `useForm` y `Field`. El registro pide solo lo que acepta la API; el resto del perfil irá en Mi perfil.
  - `main.tsx` espera a `restoreSession()` antes de pintar. `SoloConSesion`, `SoloRol` y `SoloSinSesion` hacen de guards y leen el usuario del store, así que reaccionan solas al cerrar o perder la sesión.
  - Las rejillas usan `minmax(0, 1fr)` y la regla del menú lateral se limita al nombre y al correo.
  - 18 tests en la web (12 de las rutas según el rol) y la comprobación en el navegador contra la API local, a 1366 px y a 390 px.

### 5. Primer despliegue en Docker: la imagen de la web (`feat/docker`)

- **Pregunta:** cómo servir la web compilada con nginx dentro de Docker, con las rutas de la SPA y el proxy a la API, a partir del Seminario 10.
- **Prompt:** «Según la planificación establecida previamente, vamos a proceder de esta forma. Con la estructura hecha y el login funcionando, toca el primer despliegue en Docker (bloque 2 del plan, de la 16 a la 19). Lo hacemos ya, con poco dentro, para ver si hay problemas con el servidor y no dejarlo para el final. Se hace como en el Seminario 10: te paso los repos del seminario y los datos del servidor. La conexión tiene que ir por HTTPS. [...] Hace falta el Dockerfile de la API, el de la web servida con nginx y el docker compose con MongoDB, la API y la web en el repo de despliegue. Primero que funcione en local y después en el servidor, y al final probar desde fuera que se puede iniciar sesión. Dime el plan de acción.» Después del análisis del Seminario 10: «Continúa con la parte local» mientras se consiguen los datos del servidor.
- **Incoherencias:**
  - El frontend del Seminario 10 usa nginx con la configuración por defecto, y su propio README avisa de que recargar una ruta interna da 404.
  - En el seminario la URL de la API va compilada dentro de la imagen (`http://localhost:1337`): cambiar de servidor obliga a tocar el código y reconstruir.
  - La web importa `packages/shared`, así que su `Dockerfile` no puede construirse desde `apps/web`: necesita la raíz del monorepo, y sin instalar Expo.
- **Solución:**
  - `apps/web/Dockerfile` en dos etapas desde la raíz: `npm ci --workspace` instala solo la web y shared, Vite compila con `VITE_API_URL=/api` y `nginx:1.29-alpine` sirve `dist/`.
  - `apps/web/nginx.conf`: `try_files` devuelve `index.html` en las rutas de React Router, `/api/` se reenvía a `api:1337` (quitando el prefijo) y `/socket.io/` con las cabeceras de WebSocket; los ficheros con hash llevan caché larga. Al salir todo por el mismo origen no hay CORS y la cookie del refresh vive en `/api/auth`.
  - `.dockerignore` deja fuera `node_modules`, `apps/movil`, los tests y cualquier `.env`. Un workflow de GitHub Actions pasa lint, tipos, tests y build y publica la imagen en ghcr.io.
  - Probada con el compose en local: recargar en `/dates` y en `/admin/usuarios` da 200, el login de una estudiante por `/api` entra en La Orla y la sesión se mantiene al recargar.
  - Después, para el HTTPS (`feat/https`): las reglas de nginx pasan a `apps/web/nginx/studate-app.conf`, que el server de http de la imagen (`default.conf`) incluye con `include`, y que el repo de despliegue reutiliza en su server de https. La imagen no cambia con o sin HTTPS.

### 6. La Orla en la web (`feat/orla-web`)

- **Pregunta:** cómo montar la pantalla de La Orla en la web con el estilo del blog, el gesto de deslizar bien depurado y la pantalla de ¡Date!
- **Prompt:** «Según la planificación establecida previamente, vamos a proceder de esta forma. Ahora la pantalla principal de Studate, La Orla (bloque 3 del plan, de la 20 a la 25). [...] Después la parte visual, con el estilo del blog y el CSS global, y que funcione bien. Hay que debuguear bien el gesto de pasarlo a la derecha y a la izquierda: a la derecha es A+ y a la izquierda F, con el ratón y con el dedo. Dime el plan de acción.»
- **Incoherencias:**
  - La plantilla enseña "gustos" (etiquetas de aficiones) que el modelo no tiene. Se adaptó a los datos reales: nombre con la edad (calculada de birthDate), titulación, "qué busca" y bio.
  - El aviso de deshacer llamaba a un setState del padre dentro del actualizador de estado del contador, y React avisaba de "setState mientras se pinta otro componente". Se arregló calculando el tiempo restante de una hora de fin y avisando al padre fuera del actualizador.
- **Solución:**
  - `orlaService` y sus modelos en `packages/shared`. La pantalla `Orla.tsx` con los estados (cargando, normal, vacío, error), los botones, el cupo y las flechas del teclado.
  - El gesto en `ExpedienteCard` con Pointer Events (ratón y dedo) y un helper `voteFromDrag` con el umbral, con su test. Los botones y las flechas reutilizan la misma animación de "salir volando". Respeta `prefers-reduced-motion`.
  - El aviso de deshacer con cuenta atrás (`UndoToast`) y la pantalla ¡Tenéis Date! (`MatchScreen`). Todo el CSS con las variables del tema, copiando la plantilla.
  - Probado en el navegador contra la API local (votar, ¡Date!, deshacer, cupo, teclado) a 1366 px y a 390 px; el arrastre físico queda por mirar a mano.

### 7. Mi perfil en la web (`feat/perfil-web`)

- **Pregunta:** cómo hacer la pantalla de Mi perfil (Expediente, foto y contactos de confianza opcionales) con el CSS global.
- **Prompt:** «Según la planificación establecida previamente, vamos a proceder de esta forma. Ahora Mi perfil (bloque 4 del plan, de la 26 a la 28). Es lo mismo que en cualquier web que tiene un "mi perfil": tu zona de ajustes, pero personales. El estudiante edita su Expediente y su foto, pero no puede cambiarse el rol. [...] Aquí van también los contactos de confianza, y tienen que ser opcionales: no hay que obligar a nadie a ponerlos. Mismo estilo visual y mismo CSS global que el resto. Primero el backend y después la web. Dime el plan de acción.»
- **Incoherencias:**
  - Una foto de móvil pesa varios MB y la API admite 200 KB en base64: hay que reducirla en el navegador antes de enviarla.
  - Joi no acepta cadenas vacías en la fecha, la titulación ni "qué busco", pero el formulario las tiene vacías cuando no hay dato: solo se envían si tienen valor (la bio sí puede ir vacía).
  - Las pantallas no deben cambiar la sesión, pero al guardar el perfil el menú tiene que enseñar el nombre y la foto nuevos.
- **Solución:**
  - `imageToDataUrl` reduce la foto con un `<canvas>`; `useForm` para los campos de texto y un estado aparte para la foto y la lista de contactos (hasta 3, editados en sitio).
  - `refreshMe` en el store de la sesión, documentado como la única excepción: refresca la copia del propio usuario.
  - Probado en el navegador: guardar y recargar conserva los cambios; a 1366 px y a 390 px.
