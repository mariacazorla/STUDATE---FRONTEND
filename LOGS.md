# LOGS

Bitácora del frontend de Studate. Tiene dos partes:

- **Tareas**: lo que hay que hacer en este repositorio en el sprint, agrupado por ramas. Quien cierra
  una tarea la marca.
- **Bitácora**: lo que se ha hecho, las decisiones tomadas y qué prompts de IA se han usado.

Las tareas del backend, las de estructura y las de Scrum están en el LOGS.md de
[STUDUDATE---BACKEND](https://github.com/mariacazorla/STUDUDATE---BACKEND).

## Contrato

Lo que backend y frontend tienen que cumplir igual. Si algo de aquí cambia, se cambia en los dos LOGS.md.

- **Rutas públicas**: `POST /auth/register` y `POST /auth/login`. `POST /auth/refresh` y `POST /auth/logout` se autentican con el refresh token (en la cookie o, la app del móvil, en el body). `GET /ping` y la documentación
  (`/api-docs`) también son públicas. Todo lo demás exige token.
- **Registro**: el cuerpo es `{ name, email, password }` (contraseña de 8 caracteres como mínimo; `role` no se acepta, todo usuario nuevo es `user`). Responde 201 con `{ user }` y **sin token**, 409
  si el email ya existe o 422 si el cuerpo no es válido. El frontend redirige entonces a la página de login.
- **Login**: el cuerpo es `{ email, password }`. Responde `{ token, user }` o 401. `user` es `{ _id, name, email, role, createdAt, updatedAt }`, sin contraseña. El refresh token **no va en el
  JSON**: se deja en la cookie `refreshToken` (HttpOnly, SameSite=Strict, Path=/auth, Max-Age de 7 días; Secure en producción). La ruta y el Secure de la cookie se
  cambian con `REFRESH_COOKIE_PATH` (detrás de nginx, `/api/auth`) y `COOKIE_SECURE`.
- **Login desde la app del móvil**: la misma ruta con la cabecera `X-Client: movil`. Responde `{ token, refreshToken, user }` y **no pone cookie**: la app guarda el refresh
  token en el almacén cifrado del teléfono.
- **Refresh**: la web no manda cuerpo y se lee el refresh token de la cookie; la app del móvil manda `{ refreshToken }` en el cuerpo. Si llegan los dos, se usa el del
  cuerpo. Responde `{ token }` (un access token nuevo), o 401 si no hay refresh token, ha caducado o no es válido; 422 si `refreshToken` no es un texto. El refresh token no cambia.
- **Logout**: sin cuerpo. Borra la cookie y responde 204. Después, `/auth/refresh` responde 401. La app del móvil cierra sesión borrando su refresh token.
- **Cookies y CORS**: la web llama a la API con `credentials: 'include'`; el backend responde con `Access-Control-Allow-Credentials: true` y el origen de la petición si está
  en la lista de `CORS_ORIGINS` (por defecto `http://localhost:5173` y `http://localhost:8081`; no vale `*`). Las peticiones sin `Origin` (la app del móvil) no pasan por CORS.
- **Paginación**: todos los listados aceptan `page` y `limit` (de 1 a 100) y, si no se dice `limit`, devuelven **10** elementos por página.
- **Token**: se envía en la cabecera `Authorization: Bearer <token>`. Su payload lleva los claims `sub` (id del usuario), `role` y `exp`. El access token dura 15 minutos y el refresh token 7 días.
  El frontend guarda el access token solo en memoria, nunca en `localStorage` ni `sessionStorage`; al recargar la página lo recupera llamando a `/auth/refresh` y después a `/users/me`.
- **Errores de autenticación**: 401 si falta el token, ha caducado (`{ message: 'El token ha caducado' }`) o no es válido (`{ message: 'Token no válido' }`); 403 si hay sesión pero no el rol
  necesario.
- **Usuario con sesión**: `GET /users/me` (con sesión, cualquier rol) responde `{ user: { _id, name, email, role } }`, a partir del token (`req.user`).
- **Con quién abrir un Date**: `GET /users/directory` (con sesión, cualquier rol) responde `{ users: [{ _id, name, degree?, photo? }] }`: los demás usuarios
  de rol `user` activos, ordenados por nombre.
- **Usuario**: `{ _id, name, email, role, birthDate?, degree?, lookingFor?, bio?, photo?, active, deleted, deletedAt?, createdAt, updatedAt }`, nunca con
  contraseña. `photo` es una imagen PNG o JPG en base64 (`data:image/...;base64,...`, 200 000 caracteres como mucho). Los contactos de confianza
  (`trustedContacts`: hasta 3, cada uno `{ name, email, phone? }`) son privados y **no van** en el usuario: ninguna respuesta de hoy los incluye.
- **Usuarios inactivos y archivados**: no pueden iniciar sesión ni renovar el token (401 con el mensaje de siempre). Lo hace el prehook del modelo.
  Si ya tenían sesión, cualquier petición con su token responde 401 `{ message: 'Tu cuenta no está activa' }` y el frontend cierra la sesión.
- **Gestión de usuarios** (solo `admin`):
  - `GET /users?page=&limit=&search=&role=&active=&degree=&archived=` responde `{ users, total, page, pages }`, ordenados por nombre. `search` busca en
    nombre y email; `role` es `user` o `admin`; `active` es `true` o `false`; `degree` es una titulación entera; `archived=true` lista solo los
    archivados (por defecto no salen). 400 si un filtro no es válido.
  - `GET /users/:userId` responde `{ user }`, también si está inactivo o archivado; 404 si no existe.
  - `POST /users` con `{ name, email, password, role?, active?, birthDate?, degree?, lookingFor?, bio?, photo? }` responde 201 `{ user }`; 409 si el
    email existe, 422 si el cuerpo no vale.
  - `PUT /users/:userId` con lo mismo salvo `password` (`name` y `email` obligatorios) responde 200 `{ user }`; 404 si no existe o está archivado.
    `photo: ''` quita la foto.
  - `POST /users/:userId/archive` (borrado lógico) responde 200 `{ user }` con `deleted: true`; 404 si no existe o ya estaba archivado.
  - `POST /users/:userId/restore` responde 200 `{ user }`; 404 si no existe o no estaba archivado.
  - `DELETE /users/:userId` (borrado físico) responde 204. Solo con usuarios archivados: si no, 409 `{ message: 'Archiva el usuario antes de eliminarlo' }`.
  - Un admin no puede cambiarse su propio rol, desactivarse, archivarse ni eliminarse: 403 `{ message: 'No puedes hacer esto con tu propio usuario' }`.
  - Al eliminar un usuario para siempre se borran también sus votos de La Orla, sus Dates (con el Plan y los mensajes de cada uno), sus bloqueos, sus partes y sus alertas.
- **Voto de La Orla (Grade)**: `{ _id, from, to, value, createdAt, updatedAt }`. `from` (quien vota) y `to` (a quien) llegan como
  `{ _id, name, email, photo? }`, también si el usuario está inactivo. `value` es `'A+'` o `'F'`. Un solo voto por pareja (from, to).
- **Votos de La Orla** (solo `admin`):
  - `GET /grades?page=&limit=&value=&user=` responde `{ grades, total, page, pages }`, primero los más nuevos. `user` deja los votos en los que
    ese usuario vota o es votado. 400 si un filtro no es válido.
  - `GET /grades/:gradeId` responde `{ grade }`; 404 si no existe.
  - `POST /grades` con `{ from, to, value }` responde 201 `{ grade }`; 409 si la pareja ya tiene voto (`{ message: 'Este usuario ya ha votado ese perfil' }`); 422 si `from` y `to` son el mismo usuario
    (`{ message: 'Un usuario no se puede votar a sí mismo' }`) o el cuerpo no vale; 404 si `from` o `to` no existen.
  - `PUT /grades/:gradeId` con `{ value }` responde 200 `{ grade }`. `DELETE /grades/:gradeId` responde 204 (borrado físico).
  - Si al crear un A+ o al cambiar un voto a A+ ya existe el A+ contrario, se abre un Date entre los dos (si no lo había ya).
- **Date**: `{ _id, users, status, firstTurn, expiresAt, extended, startedAt?, closedAt?, closedReason?, history, createdAt, updatedAt }`. `users` son los dos
  usuarios como `{ _id, name, email, photo? }`; `status` es `'pending'` (Pendiente), `'ongoing'` (En curso) o `'closed'` (Cerrado); `firstTurn` es el id del usuario al que
  le toca escribir primero (sorteado); `expiresAt` es 24 horas después de abrirse; `extended` dice si ya se usó la prórroga. Un solo Date por pareja.
  `startedAt` es cuándo pasó a En curso; `closedAt` y `closedReason` (`'expired'`, `'blocked'` o `'admin'`), cuándo y por qué se cerró. `history` es la lista de cambios
  de estado, `[{ status, by?, reason?, at }]`, del más antiguo al más nuevo; sin `by`, lo hizo el servidor. Todo Date nace con la entrada `pending`.
- **Dates** (cualquier usuario con sesión; el admin ve todos y un usuario normal solo los suyos):
  - `GET /dates?page=&limit=&status=&user=` responde `{ dates, total, page, pages }`, primero los más nuevos. `user` solo lo usa el admin.
  - `GET /dates/:dateId` responde `{ date }`; 404 si no existe o es de otros.
  - `POST /dates` con `{ users: [idA, idB] }` es **solo del admin** (un estudiante recibe 403: sus Dates se abren con el A+ mutuo). Responde 201 `{ date }`
    con `history: [{ status: 'pending', by: <admin>, reason: 'Abierto por un admin', at }]`; 409 si ya hay un Date entre ellos
    (`{ message: 'Ya hay un Date entre estos dos usuarios' }`); 404 si alguno no existe; 422 si no son dos ids distintos.
  - `PUT /dates/:dateId` con `{ status, reason? }` es **solo del admin** (403 si no). Responde 200 `{ date }` y añade al `history` `{ status, by: <admin>,
    reason?, at }`; al cerrar, `closedAt` es ahora y `closedReason` es `'admin'`; al reabrir se quitan los dos; a `ongoing` rellena `startedAt` si no lo
    tenía. Si el estado es el que ya tenía, no se apunta nada. 404 si no existe.
  - `POST /dates/:dateId/extend` (los dos del Date) suma 24 horas a `expiresAt`, pone `extended: true` y añade al `history` `{ status: <el que tenía>, by,
    reason: 'Prórroga de 24 horas', at }`; 409 si ya se usó (`{ message: 'La prórroga de este Date ya se ha usado' }`) o si el Date está cerrado
    (`{ message: 'Este Date está cerrado' }`). La sala del chat recibe `date:updated`.
  - `GET /dates/:dateId/messages?page=&limit=` (los dos del Date y el admin) responde `{ messages, total, page, pages }`: la página 1 son los mensajes
    **más nuevos** y dentro de cada página van en orden cronológico. 404 si el Date es de otros.
  - `DELETE /dates/:dateId` (solo admin) responde 204. Con el Date se borran su Plan y sus mensajes.
  - **Estados automáticos**: el primer mensaje del chat pasa el Date a `ongoing` (`startedAt` = hora del mensaje, `history` con `by` quien lo
    escribió y `reason: 'Primer mensaje'`). Un Date `pending` que llega a `expiresAt` lo cierra el servidor (comprobación cada minuto):
    `closed`, `closedReason: 'expired'`, `history` sin `by` y `reason: 'Caducado sin mensajes'`. Un Date `ongoing` no caduca.
- **Chat en tiempo real (socket.io)**: mismo origen y puerto que la API (en el servidor, nginx reenvía `/socket.io/`). El cliente conecta con
  `io(url, { auth: { token } })`; sin token válido, `connect_error` con el mismo mensaje que daría el 401 de la API (`Falta el token`,
  `El token ha caducado`, `Token no válido`, `Tu cuenta no está activa`). Con `El token ha caducado` el cliente renueva y reconecta; con los demás
  cierra la sesión. El token solo se comprueba al conectar. Cada Date es una sala en la que solo entran sus dos usuarios:
  - cliente → servidor: `date:join { dateId }`, `date:leave { dateId }`, `date:message { dateId, text }` (1 a 1000 caracteres; hay que haber hecho
    `date:join` antes), `date:read { dateId }`.
  - servidor → cliente: `date:joined { dateId }`; `date:message <Message>` a los dos de la sala (también a quien lo escribió, ya con `_id` y
    `createdAt`); `date:updated <Date>` cuando el Date cambia (primer mensaje, caducidad, prórroga, cambio del admin); `date:read { dateId, by, at }`;
    `chat:error { message }` (`No puedes entrar en este Date`, `Entra en el Date antes de escribir`, `Todavía no es tu turno: empieza la otra persona`,
    `Este Date está cerrado: ya no se puede escribir`, o el mensaje de Joi del texto).
  - Turno: en un Date `pending` solo escribe `firstTurn`; después del primer mensaje escriben los dos. En un Date `closed` se entra a leer, no a escribir.
- **Message**: `{ _id, date, from, text, readAt?, createdAt }`. `text` de 1 a 1000 caracteres. Llega por el socket y por `GET /dates/:dateId/messages`.
- **Bloqueos** (`/blocks`, solo rol `user`; el que bloquea sale del token. A la persona bloqueada no se le avisa y no hay ruta con la que pueda saberlo):
  - **Block**: `{ _id, blocker, blocked, createdAt }`. Un solo bloqueo por pareja (blocker, blocked).
  - `GET /blocks` responde `{ blocks }`, los míos, con `blocked` como `{ _id, name, degree?, photo? }`.
  - `POST /blocks` con `{ blocked }` responde 201 `{ block, date }`: `date` es el Date que tenían los dos y se ha cerrado (`closedReason: 'blocked'`, `history`
    con `by` quien bloqueó y `reason: 'Bloqueo'`; su sala recibe `date:updated`), o `null` si no había. 422 si es uno mismo, 404 si no existe o no es
    estudiante, 409 si ya estaba bloqueado (`{ message: 'Ya tienes bloqueada a esta persona' }`).
  - `DELETE /blocks/:userId` responde 204; 404 si no había bloqueo. El Date cerrado no se reabre.
  - Con un bloqueo en cualquiera de los dos sentidos, ninguno le sale al otro en La Orla ni puede votarlo (403), y el chat del Date está cerrado.
- **Partes** (`/reports`; mandarlo es del rol `user`, el resto solo `admin`: un estudiante que pida la lista o un parte recibe 403):
  - **Report**: `{ _id, reporter, reported, date?, reason, text?, status, severity?, resolution?, reviewedBy?, reviewedAt?, createdAt, updatedAt }`. `reporter` y
    `reported` llegan como `{ _id, name, email, photo? }`, también si están inactivos. `reason` es `'harassment'`, `'fake_profile'`, `'inappropriate'` u
    `'other'`; `status`, `'open'`, `'reviewed'` o `'dismissed'`; `severity` (`'low'`, `'medium'` o `'high'`) y `resolution` las pone el admin.
  - `POST /reports` con `{ reported, reason, date?, text? }` responde 201 `{ report }` abierto; 422 si es sobre uno mismo, si `reason` no vale o si `date` no es
    un Date mío con esa persona (`{ message: 'Ese Date no es tuyo' }`); 404 si `reported` no existe.
  - `GET /reports?page=&limit=&status=&severity=&reported=` responde `{ reports, total, page, pages }`, primero los más nuevos; 400 si un filtro no vale.
  - `GET /reports/:reportId` responde `{ report }`; 404 si no existe.
  - `PUT /reports/:reportId/review` con `{ status: 'reviewed' | 'dismissed', severity?, resolution? }` responde 200 `{ report }` con `reviewedBy` y
    `reviewedAt`; `status: 'open'` da 422. Se puede volver a revisar (se sobreescriben gravedad, resolución, quién y cuándo).
- **Botón de ayuda** (`/alerts`; pedir ayuda es del rol `user`, el resto solo `admin`):
  - **SafetyAlert**: `{ _id, user, date?, plan?, type, message?, status, attendedBy?, attendedAt?, createdAt, updatedAt }`. `user` llega como
    `{ _id, name, email, photo? }`. `type` es `'sos'`; `status`, `'open'`, `'attended'` o `'false_alarm'`.
  - `POST /alerts` con `{ date?, plan?, message? }` (todo opcional) responde 201 `{ alert, contactsNotified }`: la alerta abierta y a cuántos contactos de
    confianza se ha avisado (0 si no tiene: la alerta se crea igual y la ven los admin). 422 si `date` o `plan` no son míos. Los admin conectados reciben
    la alerta al momento por el socket (`alert:new`); el aviso a los contactos es simulado (una línea en el log del servidor por contacto, como el email
    de bienvenida).
  - `GET /alerts?page=&limit=&status=` responde `{ alerts, total, page, pages }`, primero las más nuevas; 400 si el filtro no vale.
  - `GET /alerts/:alertId` responde `{ alert }`; 404 si no existe.
  - `PUT /alerts/:alertId/attend` con `{ status: 'attended' | 'false_alarm' }` responde 200 `{ alert }` con `attendedBy` y `attendedAt`; `'open'` da 422.
    Los demás admin reciben `alert:updated`.
  - **Socket de los admin**: al conectar, un socket con rol `admin` entra solo en la sala `admins` y recibe `alert:new <SafetyAlert>` y
    `alert:updated <SafetyAlert>`. Un estudiante nunca los recibe.

## Tareas

### Sprint 1 (mínimo 1)

#### Estructura (`structure`)

- [x] Crear los dos repositorios a partir del Seminari 7 (README y ramas) · Diego
- [x] Quitar autores, libros y chat del frontend · Miguel Ángel

#### Backoffice (`backoffice`)

- [x] Lista de usuarios paginada con búsqueda y filtros · Miguel Ángel
- [x] Formulario de usuario: crear, editar, rol y activo · Miguel Ángel
- [x] Archivar, restaurar y eliminar desde el backoffice · Miguel Ángel
- [x] Acceso solo para admin (login y guards) · Miguel Ángel
- [x] Tests del frontend (dentro de cada rama) · Miguel Ángel
- [x] README del frontend (al cerrar cada rama) · Miguel Ángel

#### La Orla (`grades`)

- [x] Pantallas de Grade · María

#### Dates (`dates`)

- [x] Pantallas de Date · María

### Sprint 2

#### Estructura (`feat/estructura`)

- [x] Quitar el Angular: código, configuración, GUIA y EJERCICIO · Miguel Ángel
- [x] Esqueleto del monorepo: workspaces, .nvmrc, .gitignore, Prettier y oxlint comunes, README y CONTRIBUTING · Miguel Ángel

#### Lo compartido (`feat/shared`)

- [x] Modelos en TypeScript: User, Grade, StudateDate, Plan, Message, Block, Report y SafetyAlert · María
- [x] Cliente HTTP con JWT: access token en memoria, refresh y reintento tras un 401 · Diego
- [x] Servicios de la API (auth, users, grades, dates y plans) y los tokens del tema · Diego

#### La app del móvil (`feat/movil-base`)

- [x] apps/movil: el proyecto de Expo del Seminario 8 de React Native, vacío y arrancando con el tema común · María

#### La web (`feat/web-base`)

- [x] apps/web a partir del Seminario 8 de React, con la URL de la API en VITE_API_URL · Miguel Ángel
- [x] CSS global: los tokens como variables, global.css y componentes.css · María
- [x] Armazón del estudiante y del backoffice · Miguel Ángel
- [x] Login y registro · Miguel Ángel
- [x] Recuperar la sesión al arrancar y rutas según el rol · Miguel Ángel

#### Primer despliegue en Docker (`feat/docker`)

- [x] Dockerfile de la web: build de Vite servido con nginx, con las rutas de la SPA y el proxy de /api y /socket.io · Miguel Ángel

#### La Orla (`feat/orla-web`)

- [x] Pantalla La Orla: Expediente, botones F/deshacer/A+, cupo del día y flechas del teclado · María
- [x] Gesto de deslizar: a la derecha A+ y a la izquierda F, con el ratón y con el dedo · María
- [x] Aviso de deshacer y pantalla ¡Tenéis Date! · María

#### Mi perfil (`feat/perfil-web`)

- [x] Pantalla Mi perfil: foto, datos, contactos de confianza (opcionales) y cerrar sesión · Miguel Ángel

#### Mis Dates y chat (`feat/chat-web`)

- [x] Mis Dates: bandejas de Pendientes y En curso, con su reloj · Diego
- [x] Chat en tiempo real con el historial, el turno y la prórroga · Diego

#### Seguridad (`feat/seguridad-web`)

- [x] Bloquear y reportar desde el Expediente y desde el chat · Miguel Ángel
- [x] Botón de ayuda en el chat · Diego

#### Backoffice en React (`feat/backoffice`)

- [x] Usuarios: lista con búsqueda, filtros y paginación del servidor de 10 en 10 · Miguel Ángel
- [x] Usuarios: crear y editar; archivar, restaurar y eliminar · Miguel Ángel
- [x] La Orla del admin: votos con filtros · María
- [x] Dates y Planes del admin, con el historial de cada Date · María
- [x] Seguridad del admin: alertas de ayuda en tiempo real y partes con su gravedad · Diego

#### La app en el móvil (`feat/movil`)

- [x] Base de la app: tema común, pestañas y login con la sesión guardada de forma segura · Diego
- [x] La Orla en el móvil, con el gesto de deslizar · María
- [x] Mis Dates y chat en el móvil · Diego
- [x] Mi perfil y seguridad en el móvil · María
- [x] La app contra la API del servidor por HTTPS y demo con Expo Go (la configuración y la guía; la prueba con datos móviles, al desplegar) · Diego

#### Segundo despliegue y cierre (`feat/documentacion`)

- [x] GitHub Actions: lint, tipos, tests y build en cada push · Diego
- [x] Segundo despliegue en ea3 (https://ea3.upc.edu) y prueba de punta a punta; fix de nginx para que resuelva la API cada 10 s · Miguel Ángel
- [x] LOGS y README al día · Miguel Ángel

## Bitácora

La bitácora del Seminario 7, de donde viene este código, se conserva en el tag `seminari7-base`
(`git show seminari7-base:LOGS.md`).

### 2026-11-03 · Punto de partida y `structure`

- El repositorio nace como copia del frontend del ejercicio del Seminario 7. Antes de tocar nada se guarda
  ese código en el tag `seminari7-base`.
- Identidad: el paquete pasa a llamarse `studate-frontend`, la pestaña del navegador dice "Studate", el
  README cuenta qué es Studate y enlaza a los repos nuevos, y GUIA.md avisa de que sus ejemplos son del
  seminario (siguen en el tag).
- Este LOGS.md empieza de cero con las tareas del Sprint 1. Del contrato del seminario solo se queda la
  autenticación, que no cambia.
- Prompt de IA usado: «Lo mismo que en el backend: esto es el frontend del seminario 7 copiado tal cual. Hay
  que limpiarlo para Studate [...] Dime el plan de acción de cómo lo harías.» (conversación completa en
  `prompts/sprint-1.md`, fuera del repositorio).

### 2026-11-03 · Limpieza: fuera autores, libros y chat

- Se borran los componentes `authors-list`, `author-card`, `author-form`, `books-list`, `book-form` y `chat`,
  los services de autores, libros y chat (con sus tests), los modelos `author.model.ts` y `book.model.ts` y el
  pipe `languageName`. Se desinstala `socket.io-client` y desaparece `socketUrl` de `environment.ts`.
- Se quedan, porque los vamos a usar en las pantallas de usuarios: `pagination`, `confirm-modal`,
  `view-toggle`, el pipe `truncate` y las utilidades de `utils/`. Login, registro, interceptor y guards no cambian.
- Rutas: solo inicio, login y registro (las de Studate llegan en sus ramas). El navbar ya no tiene enlaces de
  backoffice ni de chat y la marca dice "Studate". La página de inicio saluda y explica lo que vendrá.
- Los tests que usaban `/books` o `/authors` como URL de ejemplo (login, guard e interceptor) pasan a usar
  `/users`; el test de `app` que comprobaba los enlaces del backoffice y del chat se cambia por uno que
  comprueba que con sesión ya no salen login y registro.
- README: fuera la sección del chat, las pantallas, ficheros y dependencias que ya no existen.
- Validación ejecutada: `npm run build`, `npm run lint` y `npm test -- --watch=false` en verde: 7 ficheros y 28
  tests (en el seminario eran 65; los que faltan eran de autores, libros y chat). Con la API y `ng serve`
  arrancados, en el navegador: el login de `admin@example.com` lleva a la página de inicio con el saludo; el único
  error de consola es el 401 de `/auth/refresh` al abrir la app sin sesión, que es lo esperado.
- Prompt de IA usado: el mismo de la limpieza del repositorio (ver la entrada anterior).

### 2026-11-03 · Lista de usuarios paginada con búsqueda y filtros

- Antes de empezar se revisa cómo pagina el backend (`skip` y `limit` con `countDocuments`, respuesta `{ users, total, page, pages }`)
  y se copia el contrato de la gestión de usuarios a este LOGS.md.
- Pantalla `/users` (`components/users-list`), solo para admin (`authGuard` + `adminGuard`), con el mismo patrón que la lista de libros
  del seminario: un `Subject` con `switchMap` pide cada página a la API y cancela la anterior si llega otra (por ejemplo, al escribir en
  el buscador), y el componente `app-pagination` se reutiliza tal cual.
- 10 usuarios por página. Filtros: buscador (nombre o email), rol, estado (activos o inactivos), titulación y "Ver archivados".
  Al cambiar un filtro se vuelve a la página 1. El de titulación no existía en la API: se añadió en la rama `users` del backend.
- `UserService.getUsers` solo envía los filtros que tienen valor (con `HttpParams`). El modelo `User` gana los campos del perfil y del
  estado, y hay una lista `DEGREES` con las titulaciones de la EETAC para el filtro (y luego el formulario).
- Componente nuevo `app-avatar`: la foto de perfil recortada en un círculo (`object-fit: cover`) o, si no hay foto, las iniciales sobre
  un color que sale del nombre. Se usará en todas las listas.
- `styles.css`: pastillas de estado (`.pill`) y tablas con la clase `stack`, que en el móvil se ven como tarjetas.
- Navbar: enlace "Usuarios" solo para admin; la página de inicio tiene un botón "Gestionar usuarios".
- Tests nuevos: `user.service.spec.ts` (que no se envían los filtros vacíos y sí los que tienen valor) y `users-list.spec.ts` (pinta una
  fila por usuario con su estado, pide la página elegida y vuelve a la 1 con los filtros). El de `app` comprueba que el admin ve
  "Usuarios" y un `user` no.
- Validación ejecutada: `npm run build`, `npm run lint` y `npm test -- --watch=false` en verde (9 ficheros, 34 tests). En el navegador con la
  API y el seed: como admin, 12 usuarios en 2 páginas, los inactivos en gris, y "Ver archivados" enseña a Sara y Dani.
- Prompt de IA usado: «Empezamos por la lista de usuarios paginada con búsqueda y filtros. Primero quiero ver cómo está montada la
  paginación en el backend [...] quiero 10 usuarios por página y algunos filtros, los más típicos. ¿Qué filtros me sugieres?»

### 2026-11-03 · Formulario de usuario: crear, editar, rol y activo

- Pantallas `/users/new` y `/users/:id/edit` (`components/user-form`), solo para admin, con la forma del formulario de autores del
  seminario: formulario reactivo con validadores, `removeEmpty` antes de enviar, modo crear o editar según haya `:id` y los errores de la
  API con `apiErrorMessage`.
- Es como el registro, pero el admin elige el rol, si el usuario está activo y el perfil (titulación de la lista `DEGREES`, qué busco, bio
  con contador de 500, fecha de nacimiento y foto). La contraseña y su repetición (validador `passwordMatch`) solo se piden al crear;
  desde el backoffice no se cambia la contraseña de nadie.
- Foto de perfil: se elige un PNG o JPG y `utils/image-to-data-url.ts` lo recorta en un cuadrado de 256 x 256 en un `<canvas>` y lo pasa a
  JPG en base64. Una foto del móvil de varios MB se queda en pocos KB (la de la prueba, 3747 caracteres). Se enseña ya recortada en el
  círculo de `app-avatar` antes de guardar, y "Quitar foto" envía `photo: ''`.
- Si el admin se edita a sí mismo, el rol y el activo salen deshabilitados con un aviso; además no se envían (la API respondería 403).
- La lista tiene ahora "Nuevo usuario" y un botón "Editar" en cada fila (no en los archivados: hay que restaurarlos antes).
- Problema encontrado: un usuario desactivado seguía pudiendo usar la API con su token hasta que caducaba. Se arregla en el backend
  (`VerifyToken` comprueba que la cuenta sigue activa y responde 401); aquí no hay que tocar nada, porque el interceptor ya cierra la
  sesión con ese 401.
- Tests nuevos en `user-form.spec.ts`: al crear pide contraseña y que coincida, al crear envía el rol y el activo, al editar no pide
  contraseña y hace un PUT sin ella, con el propio usuario el rol y el activo están bloqueados, y quitar la foto envía `photo: ''`.
- Validación ejecutada: `npm run build`, `npm run lint` y `npm test -- --watch=false` en verde (10 ficheros, 39 tests). En el navegador: se crea
  "Paula Ruiz" con titulación, qué busco y una foto PNG; la foto se ve recortada antes de guardar, el usuario sale en la lista y en MongoDB
  la foto está guardada como JPG en base64.
- Prompt de IA usado: «Ahora el formulario de usuario: crear, editar, rol y activo. Es básicamente el register que ya tenemos, pero hecho
  bien y adaptado a los roles. Lo de activo es importante [...] Dame el plan de acción.»

### 2026-11-03 · Archivar, restaurar y eliminar desde el backoffice

- Soft delete primero: en la lista normal cada usuario tiene "Archivar", que abre el `confirm-modal` del seminario ("no podrá
  iniciar sesión; podrás restaurarlo desde Ver archivados"). En "Ver archivados" salen "Restaurar" (sin modal: no se pierde nada) y
  "Eliminar para siempre" (hard delete), con el modal "¿Estás seguro de que quieres eliminar este usuario?" que avisa de que no se puede
  deshacer.
- Un solo modal para las dos acciones: la signal `pending` guarda el usuario y la acción, y los textos del modal son `computed` que
  cambian según la acción.
- En la fila del admin con sesión no sale "Archivar" (la API respondería 403). Si la API responde 409 o 403, se enseña su mensaje.
- Después de cada acción se recarga la página actual; si el usuario era el último de su página, se pasa a la anterior, como hacía la
  lista de libros del seminario.
- `UserService`: `archiveUser` y `restoreUser` (POST) y `deleteUser` (DELETE).
- Arreglo: el test del formulario navegaba a `/users` sin que el router de prueba tuviera esa ruta y Vitest avisaba de 3 errores no
  controlados (aunque los tests pasaban). Se le da una ruta vacía `users` y desaparecen.
- Tests nuevos: los tres métodos del service; en la lista, archivar después de confirmar recarga la página, en archivados salen
  "Restaurar" y "Eliminar para siempre" y el modal de eliminar avisa, y en la fila propia solo sale "Editar".
- Validación ejecutada: `npm run build`, `npm run lint` y `npm test -- --watch=false` en verde y sin avisos (10 ficheros, 43 tests). En el
  navegador con el seed recién hecho: archivar a Clara con el modal, verla en archivados, eliminarla para siempre con el modal de "¿Estás
  seguro?" (en MongoDB ya no está) y restaurar a Sara (en MongoDB vuelve a `deleted: false`).
- Prompt de IA usado: «Ahora archivar, restaurar y eliminar desde el backoffice [...] Cuando quiera eliminar para siempre, que me salga un
  modal de "¿Estás seguro de que quieres eliminar esto?" y, si le doy, se elimina. ¿Cómo lo harías? Plan de acción.»

### 2026-11-03 · Backoffice solo para admin y adaptado a Studate

- Con la zona de usuarios hecha, se repasa el backoffice entero para que solo lo use un admin: todas sus rutas (`/users`, `/users/new`,
  `/users/:id/edit`) llevan `authGuard` y `adminGuard`, y en la barra de arriba sus enlaces van detrás de la etiqueta "Backoffice", que un
  `user` no ve. El registro se queda: es por donde entra la gente normal; el backoffice es una zona aparte dentro de la misma app.
- Después del login, un admin va directo a `/users` y un `user` a la página de inicio, que le explica que el backoffice es solo para
  administradores. Con `returnUrl` se respeta a dónde iba.
- Aspecto de Studate (el del mockup), sin cambiar la estructura del seminario: la paleta en variables de `styles.css` (el índigo un poco más
  vivo, el coral de la marca y grises con un toque de azul), barra oscura con "Stu**date**" y la página actual subrayada en coral, radios de 8
  px y un contorno visible al moverse con el teclado.
- Móvil: la barra hace salto de línea y la sesión baja a su propia fila; en la lista de usuarios cada filtro ocupa toda la fila. Problema
  encontrado al probarlo con el ancho de un móvil: el select de titulaciones era más ancho que la pantalla y salía scroll horizontal; se
  limita su ancho.
- Tests: el de login comprueba que un admin va a `/users` y uno nuevo que un `user` va al inicio. Los specs dejan de usar la contraseña del
  seminario (`seminari7`) y usan la del seed nuevo.
- README: usuarios de ejemplo, pantallas del backoffice, estructura del proyecto (componentes, service y utilidad nuevos), qué protege cada
  guard y las reglas de la API que hay que saber (archivado, eliminar y foto).
- Pruebas del bloque `backoffice`: `npm run build`, `npm run lint` y `npm test -- --watch=false` en verde (10 ficheros, 44 tests). En el
  navegador, con el seed recién hecho: login de admin (va a Usuarios), lista con filtros y archivados, crear un usuario con foto, archivar,
  eliminar para siempre con el modal, restaurar, y la misma lista con 390 px de ancho (tarjetas, sin scroll horizontal).
- Prompt de IA usado: «Ahora que ya tenemos la zona de usuarios, esto lo tienen que administrar los administradores. Hay que rehacer el
  backoffice bien hecho: login y guards solo para admin, y adaptarlo a los modelos nuevos. Plan de acción.»

### 2026-11-03 · Pantallas de La Orla (Grade)

- El mockup de la pantalla ya estaba hecho y validado (la pantalla "La Orla" del artifact del backoffice): se implementa tal cual.
- `/grades` (`components/grades-list`), solo admin: tabla con quién vota y a quién (con `app-avatar`), la nota (A+ en verde, F en rojo, con
  class binding), la fecha (pipe `date`) y las acciones "Cambiar a F/A+" (PUT, sin confirmación porque se puede volver a cambiar) y
  "Eliminar" (con `confirm-modal`). Filtros por nota y por usuario, 10 por página, mismo patrón `Subject` + `switchMap` que los usuarios.
- `/grades/new` (`components/grade-form`): quién vota, a quién y la nota. En los selects solo salen los usuarios activos de rol `user`, y
  un validador de grupo (`differentUsersValidator`, como `passwordMatch`) no deja votarse a uno mismo. Un 409 (pareja repetida) enseña el
  mensaje de la API.
- Responsive desde el principio: la tabla lleva la clase `stack` y en el móvil cada voto es una tarjeta; los filtros ocupan toda la fila.
- El bloque `.person` (foto, nombre y email) se usaba ya en dos pantallas: pasa de los `.css` de cada componente a `styles.css`.
- `grade.model.ts` y `GradeService` (`getGrades`, `createGrade`, `updateGrade` y `deleteGrade`). Contrato de Grade copiado del backend.
- Navbar: "La Orla" en la zona del backoffice; la página de inicio del admin tiene el acceso.
- Tests nuevos: service (filtros, crear, cambiar nota y eliminar), lista (pinta el voto, cambia A+ a F y recarga, filtra por nota desde la
  página 1 y elimina tras confirmar) y formulario (no deja votarse a sí mismo, pide solo usuarios activos de rol user y envía el voto).
- Validación ejecutada: `npm run build`, `npm run lint` y `npm test -- --watch=false` en verde (13 ficheros, 52 tests). En el navegador: la
  lista con los 25 votos del seed en 3 páginas; en el formulario, el aviso al elegir el mismo usuario en los dos lados y un voto nuevo de
  Clara a Pau que aparece el primero; y la misma lista con 390 px de ancho (tarjetas).
- Prompt de IA usado: «Ahora las pantallas de La Orla (Grade). Antes de programar, hazme un mockup para ver cómo quedaría esta pantalla.» y
  «Y si luego hay que usarlo desde el teléfono, que esta pantalla sea responsive, que se vea bien en el móvil.»

### 2026-11-03 · Pantallas de Date

- Como en La Orla, el mockup ya estaba validado (pantalla "Dates" del artifact, con la vista del admin y la de "Mis Dates" del usuario) y se
  hace responsive desde el principio (tabla `stack`).
- `/dates` (`components/dates-list`) es la pantalla de entrada para todos después del login: la ruta `''` redirige allí y desaparece la página
  de inicio, que ya no tenía uso. Pestañas con las bandejas del blog (Pendientes, la de entrada, En curso, Cerrados y Todos), estado con un
  select que cambia de bandeja, caducidad (pipe `date`, con "caducado" si ya pasó), prórroga (+24 h, el botón se deshabilita cuando se usa y
  un 409 enseña el mensaje de la API) y paginación.
- Lo que se ve depende del rol (la API ya filtra por el token):
  - El admin ve "Dates": las dos personas de cada pareja, en negrita la que escribe primero, filtro por usuario y "Eliminar" con el modal.
  - Un usuario ve "Mis Dates": "Con" (la otra persona), "Empieza" ("Tú" o su nombre) y sin eliminar.
- `/dates/new` (`components/date-form`): el admin elige a los dos usuarios (validador de grupo para que no sean el mismo); un usuario normal
  elige solo "con quién", y él es el otro. Para la lista, el usuario normal no puede usar `GET /users` (es del backoffice): se añadió
  `GET /users/directory` en el backend (rama `dates`).
- El modelo se llama `StudateDate` y no `Date`: con `Date` como interfaz, `new Date()` dejaría de ser una fecha en los componentes que la usan
  (en `dates-list` se usa para saber si un Date ha caducado). En el backend pasa lo mismo con `DateModel`.
- Navbar: "Dates" para cualquiera con sesión, delante de la zona del backoffice. Después del login todos van a `/dates`. La ayuda del formulario
  de votos ("si los dos se han dado A+, se abre un Date") se añade ahora, que ya es verdad.
- Tests nuevos: service (filtro de estado, abrir, cambiar estado, prórroga y eliminar), lista (un `user` ve con quién y quién empieza y no tiene
  "Eliminar"; el admin ve a los dos y "Eliminar"; cambiar de pestaña pide desde la página 1; el 409 de la prórroga enseña el mensaje) y formulario
  (el `user` usa el directorio y es uno de los dos; el admin no puede elegir dos veces al mismo). Se actualizan los de login y app.
- Validación ejecutada: `npm run build`, `npm run lint` y `npm test -- --watch=false` en verde (16 ficheros, 60 tests). En el navegador: con una
  sesión abierta de antes del seed, la API responde 401 y la app lleva al login (el arreglo de usuarios inactivos funcionando); como `user`, solo su
  Date con Oriol ("Empieza: Tú"), la prórroga suma 24 horas y se deshabilita, abre un Date con Laia y `/users` lo devuelve a Dates; como admin,
  los 5 Dates con las dos personas, "caducado" en el cerrado y el filtro por usuario; y con 390 px de ancho, tarjetas.
- Prompt de IA usado: «Las pantallas de Dates, igual que las de La Orla: primero el mockup para verlo, y responsive desde el principio para que se
  vea en el móvil.»

### 2026-11-03 · README final y contrato al día

- Repaso final del README contra el código: la introducción explica las dos zonas de la app (Dates para todos y el backoffice solo para el
  admin), y los scripts dicen cuántos tests hay. Las pantallas, la estructura del proyecto y la autenticación ya se habían ido poniendo al día
  al cerrar cada rama; se comprueba que coinciden con `app.routes.ts` y con `src/app/`.
- Contrato copiado otra vez del backend: el 409 de un voto repetido ahora trae el mensaje "Este usuario ya ha votado ese perfil" (antes
  "from ya existe"), que es el que enseña el formulario de nuevo voto.
- Validación ejecutada: `npm run build`, `npm run lint` y `npm test -- --watch=false` en verde (16 ficheros, 60 tests); con la API, el formulario de
  nuevo voto con una pareja repetida enseña el mensaje nuevo.
- Prompt de IA usado: el README va "al final de cada rama, como continuación"; esta es la del cierre del sprint.

### 2026-11-25 · Sprint 2: la estructura (de Angular a un monorepo en React)

- El backoffice en Angular del Sprint 1 se rehace en React y el repositorio pasa a ser un monorepo con tres carpetas: `apps/web` (React y
  Vite), `apps/movil` (Expo) y `packages/shared` (lo que no se pinta). El Angular completo se conserva en el tag `angular-sprint1` y en `main`.
- **`feat/estructura`**: un commit que solo borra el Angular (se quedan el historial, los AI_LOG, este LOGS y el mockup) y otro con el esqueleto:
  `package.json` raíz con npm workspaces y los comandos comunes, `.nvmrc` con Node 24, y Prettier y oxlint con una sola configuración. React
  queda fijado a 19.2.3 con `overrides`, porque es la versión exacta que necesita Expo SDK 57 y en un monorepo solo puede haber una copia.
- **`feat/shared`**: los modelos en TypeScript de los ocho modelos del backend y `Paginated<T>`; el cliente HTTP con JWT (`request()`, con la
  forma del Seminario 8 y lo que hacía el interceptor de Angular); los servicios de `auth`, `users`, `grades`, `dates` y `plans`; la sesión en
  un store de Nanostores (`$user`); y `tokens.ts` con el tema. Lo que cambia entre la web y el móvil va en un adaptador que cada app pasa con
  `configureHttp()`, así que este paquete no importa nada del navegador ni de Expo (lo comprueba una regla del linter).
- Decisiones del cliente HTTP: ante cualquier 401 de una ruta protegida se renueva el token una vez y se repite la petición, sin depender del
  texto del mensaje; si varias peticiones fallan a la vez, comparten una sola renovación; si no se puede renovar, se avisa y el store olvida al
  usuario; y un fallo de red no cierra la sesión.
- **`feat/movil-base`**: `apps/movil` con lo mínimo del proyecto de Expo del Seminario 8 de React Native, sin `metro.config.js` (desde el SDK 52
  Expo configura Metro solo en un monorepo). Su pantalla de inicio pinta con `tokens`. Se hizo después de `feat/shared`, y no dentro de
  `feat/estructura` como decía el plan, porque necesita el tema.
- **`feat/web-base`**: `apps/web` con la estructura del Seminario 8 de React. El tema se vuelca como variables CSS antes del primer render y
  todo el estilo está en `global.css` (base, tipografía, maquetación y armazón) y `componentes.css` (botón, tarjeta, chip, campo, aviso, tabla,
  paginación, vacío, esqueleto, acceso y ventana de confirmación), sin un solo color escrito a mano. `/estilos` enseña todas las piezas.
  El armazón es un solo componente para el estudiante y el admin; login y registro siguen el diseño acordado; y al arrancar se recupera la
  sesión antes de pintar. Las rutas protegidas (`SoloConSesion`, `SoloRol` y `SoloSinSesion`) hacen el papel de los guards de Angular.
- Dos cosas del diseño que no se han hecho porque la API no las tiene: en el registro, la fecha de nacimiento y la titulación (la API solo
  acepta nombre, correo y contraseña; irán en Mi perfil) y la comprobación del dominio universitario.
- Validación ejecutada: `npm run lint` sin errores, `npm run typecheck` y `npm run build` en verde, y `npm test` con 40 tests (15 del cliente
  HTTP, 7 del servicio de autenticación, 12 de las rutas según el rol, 3 del tema y 3 de formato). En el navegador, con la API local y el seed:
  una contraseña mala enseña el error debajo del campo; Laia (estudiante) entra en La Orla y el admin, en Usuarios; al recargar no se pierde la
  sesión; el estudiante que abre `/admin` vuelve a `/orla` y el admin que abre `/orla` vuelve a `/admin`; y cerrar sesión lleva al login. Las
  pantallas se han mirado a 1366 px y a 390 px de ancho, sin desbordes. La app del móvil empaqueta con `expo export` para web y para Android;
  queda por verla en un teléfono con Expo Go.
- Prompt de IA usado: el del bloque "Estructura" del Sprint 2, que está entero en [AI_LOG.md](AI_LOG.md).

### 2026-11-25 · Sprint 2: la imagen de Docker de la web (`feat/docker`)

- `apps/web/Dockerfile` en dos etapas, construido desde la raíz del monorepo (`docker build -f apps/web/Dockerfile .`): `node:24-alpine`
  instala solo la web y `packages/shared` (`npm ci --workspace`, sin Expo) y compila con Vite con `VITE_API_URL=/api`; `nginx:1.29-alpine`
  sirve `dist/` (93 MB en total).
- `apps/web/nginx.conf` propio, en lugar de la configuración por defecto del Seminario 10: devuelve `index.html` en las rutas de React
  Router, reenvía `/api/` a `api:1337` quitando el prefijo y `/socket.io/` con las cabeceras de WebSocket (para el chat del bloque 5), y
  da caché larga a los ficheros con hash. Al salir la web y la API por el mismo origen no hay CORS, la URL de la API compilada es `/api` (vale
  para cualquier servidor) y la cookie del refresh token vive en `/api/auth`.
- `.dockerignore` en la raíz: fuera `node_modules`, `dist`, `apps/movil`, los tests, la documentación y cualquier `.env`.
- Workflow de GitHub Actions (`.github/workflows/ci.yml`): lint, tipos, tests y build de todo el monorepo en cada push y pull request; en los
  push, además, publica la imagen en ghcr.io (`latest` desde `main` y `develop` desde `develop`).
- Validación ejecutada: `docker build` sin errores, `nginx -t` correcto y `apiUrl: "/api"` dentro del bundle. Con el `docker compose` del repo
  STUDATE---DOCKER en local: recargar en `/dates` y en `/admin/usuarios` da 200, `/api/ping` responde a través de nginx, el login de Laia
  por `/api/auth/login` entra en La Orla y al recargar la sesión se mantiene (`/api/auth/refresh` 200 con la cookie y después `/users/me`),
  sin ningún error en la consola. El workflow no se ha podido ejecutar todavía: lo hará el primer push.
- Prompt de IA usado: el del bloque "Primer despliegue en Docker" del Sprint 2, que está entero en [AI_LOG.md](AI_LOG.md).
- Más tarde, en `feat/https`: la configuración de nginx se divide en `apps/web/nginx/default.conf` (el server de http, en la imagen) y
  `apps/web/nginx/studate-app.conf` (las reglas, que incluyen con `include` ese server y el de https del repo de despliegue). Probado con el
  compose por https en local: TLS 1.3, HTTP/2, cookie `Secure` y la sesión se renueva.

### 2026-11-25 · Sprint 2: La Orla en la web (`feat/orla-web`)

- La Orla es la pantalla principal del estudiante, como un Tinder pero de estudiantes. El servicio `orlaService` y sus modelos van en
  `packages/shared` (`next`, `vote`, `undo`), para que los use también el móvil.
- **Pantalla** (`pages/Orla.tsx`): la tarjeta del Expediente (foto o iniciales, nombre con la edad, titulación, "qué busca" y bio), los botones
  F, deshacer y A+, el cupo de A+ de hoy en la cabecera y los estados de cargando (esqueleto), vacío ("ya has visto a todo tu campus") y error.
  Se vota con los botones y con las flechas del teclado; con el cupo lleno, el botón A+ se desactiva con el aviso de volver mañana.
- **Gesto de deslizar** (`ExpedienteCard` + `swipe.ts`): con Pointer Events, así que vale igual para el ratón y para el dedo. La tarjeta sigue al
  gesto con una rotación ligera y un sello A+ o F según el lado; al soltar, si se pasa del umbral (90 px) sale volando y vota, y si no, vuelve a
  su sitio. Un arrastre corto no vota. Los botones y las flechas reutilizan la misma animación. Respeta `prefers-reduced-motion`.
- **Aviso de deshacer y ¡Date!** (`UndoToast`, `MatchScreen`): tras votar, un aviso con una cuenta atrás de 10 s; desaparece solo o, al pulsar,
  devuelve el perfil anterior. Cuando un A+ forma un A+ mutuo, la pantalla ¡Tenéis Date! a pantalla completa con las dos personas, el sorteo del
  turno y los botones de ir a Mis Dates o seguir en La Orla.
- Todo el CSS nuevo va en `componentes.css` con las variables del tema, copiando las clases de la plantilla (`.exp`, `.voto`, `.cupo`, `.sello`,
  `.match`...). Ninguna pantalla define colores propios.
- Validación ejecutada: `npm run lint`, `npm run typecheck`, `npm run build` y `npm test` en verde (3 tests nuevos del umbral del gesto). En el
  navegador contra la API local con el seed: Laia ve Expedientes y vota con los botones y con el teclado; aprobar a Nerea (que ya le había dado
  A+) abre el ¡Date! con el sorteo; votar F enseña el aviso de deshacer con la cuenta atrás; deshacer devuelve el perfil anterior; el cupo baja
  con cada A+; sin errores en consola; a 1366 px y a 390 px. El gesto físico de arrastrar queda por mirar a mano en el navegador (su lógica, el
  umbral, está en el test).
- Prompt de IA usado: el del bloque "3 · La Orla" del Sprint 2, que está entero en [AI_LOG.md](AI_LOG.md).

### 2026-11-25 · Sprint 2: Mi perfil en la web (`feat/perfil-web`)

- `pages/MiPerfil.tsx`: al entrar se rellena con `GET /users/me` (nombre, fecha de nacimiento, titulación, "qué busco", bio, foto y contactos) y se
  guarda con `PUT /users/me` (`userService.updateMe`, nuevo en `packages/shared`). El email se enseña pero no se edita; el rol ni aparece.
- La foto: el fichero se reduce en el navegador (`utils/image-to-data-url.ts`, un `<canvas>` a 640 px y JPEG al 82 %) antes de guardarla en
  base64, para no pasar de los 200 KB de la API. Se puede quitar (`photo: ''`).
- Los contactos de confianza se editan en sitio (nombre, correo y teléfono opcional), hasta 3, con un vacío que explica que son opcionales. Solo se
  envían los que tienen nombre y correo. Al guardar, `refreshMe` (nuevo en el store de la sesión) refresca la copia en memoria para que el menú
  enseñe el nombre y la foto nuevos.
- Validación ejecutada: `npm run lint`, `npm run typecheck`, `npm run build` y `npm test` en verde. En el navegador contra la API local: Laia ve
  su perfil con sus 2 contactos; cambia la bio y "qué busco", guarda, y al recargar los cambios siguen; sin errores en consola; a 1366 px y a 390 px.
- Prompt de IA usado: el del bloque "4 · Mi perfil" del Sprint 2, que está entero en [AI_LOG.md](AI_LOG.md).

### 2026-11-25 · Sprint 2: Mis Dates y el chat en la web (`feat/chat-web`)

- **Mis Dates** (`pages/MisDates.tsx`, `components/dates/ListaDates.tsx`): las dos bandejas del blog, Pendientes (fuego) y En curso (corazón), con su
  contador; el aviso de los Dates que esperan que escriba yo y cuánto queda del más urgente; y una tarjeta por Date con la otra persona, a quién le
  toca ("Te toca escribir a ti" / "Empieza Pau") y el reloj de lo que falta para caducar. El reloj se recalcula cada medio minuto con el hook `useNow`.
  Los cerrados no se listan. Se cargan todos de una vez (`dateService.getMyDates`, hasta 100) y se reparten entre las bandejas en la pantalla.
- **La misma pantalla para la lista y la conversación**: `/dates` y `/dates/:dateId`. En escritorio se ven las dos columnas (340 px + la charla) y
  en el móvil solo una, con el botón de volver, como en la plantilla. Un Date abierto por su URL que no está en las bandejas (uno cerrado) se pide
  aparte con `GET /dates/:id`.
- **El socket** (`packages/shared/src/services/chat.service.ts` y `models/chat.model.ts`, los mismos eventos que el backend): `connectChat()` abre
  socket.io contra el origen de la API (con `VITE_API_URL=/api`, contra el origen de la página, donde nginx reenvía `/socket.io`) mandando el access
  token en el handshake con una función, para que cada reconexión lleve el token actual. Si el servidor rechaza por "El token ha caducado", renueva
  con el refresh token y reconecta. La web lo abre una vez por pantalla con el hook `useChat` y lo cierra al salir.
- **La conversación** (`components/dates/Charla.tsx`): carga la última página del historial por HTTP (`dateService.getMessages`, 50 por página, con
  "Ver mensajes anteriores" si hay más), entra en la sala del Date (`date:join`, y otra vez en cada reconexión) y escucha `date:message`,
  `date:updated`, `date:read` y `chat:error`. Mis mensajes a la derecha en azul con la hora y ✓ / ✓✓ (leído); los de la otra persona a la izquierda;
  separadores de día (HOY, AYER, fecha). Mientras el Date está pendiente, solo escribe quien tiene el turno: la otra persona ve el campo desactivado
  con "Empieza Pau…" y el reloj "Quedan 23 h 12 min"; el primer mensaje pasa el Date a En curso y la lista lo mueve de bandeja sola gracias a
  `date:updated`. La prórroga (+24 h, una vez) está en la franja del Date y la otra persona la ve llegar sin recargar. En un Date cerrado se lee pero
  no se escribe. Los avisos del servidor (`chat:error`) salen como toast.
- Lo de `packages/shared` sirve igual para el móvil: `otherUser`, `isMyTurn`, `remainingMs`, `replaceDate` (`utils/dates.ts`) y `MESSAGES_PAGE_SIZE`.
- Validación ejecutada: `npm run lint`, `npm run typecheck` y `npm test` en verde (5 tests nuevos de los textos de tiempo). En el navegador contra
  la API local: Hugo ve su Date pendiente con Júlia en Pendientes (1), el aviso "Tienes 1 Date esperando que escribas tú. Quedan 47 h" y la etiqueta
  de prórroga; abre la conversación y ve "Te toca empezar. Quedan 47 h 44 min" y el vacío "Aún no hay mensajes"; escribe el primer mensaje y al
  momento la franja pasa a "En curso · Empezó hoy a las 16:26" y las bandejas a Pendientes 0 / En curso 1 sin recargar; Júlia, desde otro socket,
  contesta y su mensaje aparece al instante, y al marcarlo como leído el mensaje de Hugo pasa de ✓ a ✓✓. Sin errores en consola de la app; a 1366 px
  (dos columnas) y a 390 px (lista y conversación por separado, con el botón de volver).
- Prompt de IA usado: el del bloque "5 · Mis Dates y chat" del Sprint 2, que está entero en [AI_LOG.md](AI_LOG.md).

### 2026-11-25 · Sprint 2: Seguridad en la web (`feat/seguridad-web`)

- Los servicios de seguridad van en `packages/shared` (`blockService`, `reportService`, `safetyAlertService`), con sus modelos ya creados en la
  estructura, y los eventos `alert:new` y `alert:updated` en el contrato del socket (`chat.model.ts`), para que el móvil y el backoffice los usen igual.
- **Las ventanas** (`components/Ventana.tsx`): el mismo patrón que `ConfirmModal`, pero con el contenido libre y, por debajo de 640 px, pegada abajo como
  una hoja, como en la plantilla. Se pinta con un portal en el `body`, porque se abre desde dentro de la tarjeta del Expediente, que tiene un `transform`
  (y ahí `position: fixed` no funciona). Como los eventos de React suben por el árbol de componentes aunque el DOM esté en otro sitio, la ventana corta
  el `pointerdown` para que la tarjeta no capture el puntero y se quede con el clic (fue el primer fallo al probarla).
- **Bloquear y mandar un parte** (`components/seguridad/`): el botón de los tres puntos (`AccionesSeguridad`) está en la esquina del Expediente de La
  Orla y en la cabecera del chat, siempre a un toque. Abre un menú con las dos acciones. `ReportarModal`: el motivo (obligatorio, con los cuatro de la
  API), un comentario opcional y el atajo a bloquear; desde el chat manda también el Date. `BloquearModal` explica lo que pasa y pide confirmación en
  rojo; si ya estaba bloqueado (409) lo dice y no es un error. Al bloquear desde La Orla se carga el siguiente Expediente; desde el chat, el Date cerrado
  que devuelve la API sustituye al de la lista (desaparece de las bandejas) y se vuelve a Mis Dates.
- **Botón de ayuda** (`BotonAyuda`, `AyudaModal`): el escudo rojo de la cabecera del chat (no sale en un Date cerrado). La ventana pide los contactos
  de confianza a `GET /users/me` al abrirse para decir a cuántos se avisará (o, sin contactos, que se avisa igualmente al equipo y que se pueden añadir
  en Mi perfil), un mensaje opcional, el recordatorio del 112 y el botón en rojo. Al enviar, un toast dice a quién se ha avisado. Si falla, se puede
  volver a enviar sin cerrar la ventana.
- CSS nuevo en `componentes.css`: `.ventana`, `.t-ventana`, `.opciones`, `.urg`, `.botonera`, `.exp .mas` y `.et.peligro`, con las variables del tema.
- Validación ejecutada: `npm run lint`, `npm run typecheck`, `npm run build` y `npm test` en verde. En el navegador contra la API local: Laia abre el menú
  del Expediente, manda un parte (sin motivo avisa; con "Acoso o insultos" y un comentario, toast de enviado) y bloquea a Usuario (toast y el siguiente
  Expediente); Hugo, en el chat con Júlia (campo desactivado con "Empieza Júlia…"), la bloquea desde los tres puntos y vuelve a Mis Dates sin Dates;
  Usuario pulsa el escudo en el chat con Oriol, ve "Avisaremos ahora a tu contacto de confianza y al equipo", escribe un mensaje y pide ayuda: toast
  de enviado y el aviso simulado al contacto en el log de la API. Sin errores en consola de la app; a 1366 px y a 390 px (la ventana como hoja abajo).
- Prompt de IA usado: el del bloque "6 · Seguridad" del Sprint 2, que está entero en [AI_LOG.md](AI_LOG.md).

### 2026-11-25 · Sprint 2: el backoffice en React (`feat/backoffice`)

- Lo del Angular del Sprint 1 rehecho en React con la piel de Studate y el mismo CSS global que la app del estudiante. Las piezas comunes están en
  `components/admin/` (`Persona`, `EstadoLista`, `PaginacionBo`) y en el hook `usePagedList`, que pide una página a la API cada vez que cambian la
  página o los filtros (paginación del servidor de 10 en 10, `PAGE_SIZE`), cancela la petición anterior y da el estado (cargando, normal, vacío o
  error). Cada pantalla pinta una tabla y, por debajo de 760 px, las mismas filas como tarjetas (`.tarjetas-bo`), como en la plantilla.
- **Usuarios** (`UsuariosAdmin`, `UsuarioForm`): búsqueda por nombre o correo (con 300 ms de espera para no pedir una página por tecla), filtros por
  rol, estado y titulación y el de solo archivados; acciones de editar, archivar, restaurar y eliminar (solo si está archivado, como pide la API), con
  confirmación. El formulario crea (con contraseña) y edita (sin ella) con rol, cuenta activa, perfil y foto reducida en el navegador; la zona de
  peligro archiva, restaura o elimina. El 409 del correo repetido se enseña como "Ya hay otra cuenta con este correo".
- **La Orla** (`OrlaAdmin`): los votos con filtro por persona (los estudiantes del directorio) y por nota, "Hoy, 16:34" en la columna de cuándo, y
  eliminar con confirmación. Sin "nuevo voto": con la app del estudiante el admin ya no crea votos a mano.
- **Dates y Planes** (`DatesAdmin`): dos pestañas. Dates con filtro por estado, pareja con los dos avatares, turno y caducidad, y las acciones de ver
  (ventana con los datos y el historial completo: cada cambio con su chip, el motivo, quién lo hizo y cuándo), cerrar a mano (con motivo opcional, que
  queda en el historial; `dateService.updateStatus` acepta ahora `reason`) y eliminar. Planes con búsqueda por sitio, estado y archivados, el sitio
  elegido o el número de tiradas, el detalle con las tiradas y archivar, restaurar y eliminar.
- **Seguridad** (`SeguridadAdmin`): el socket del chat (`useChat`) sirve también aquí: un admin entra solo en la sala `admins` y cuando alguien pide
  ayuda llega `alert:new`, la lista se vuelve a pedir sin recargar y sale un toast con quién. Las alertas abiertas se marcan como atendidas o falsa
  alarma (y `alert:updated` actualiza a los demás admin); de cada una se dice con quién estaba (se pide su Date) y el mensaje. Los partes, con filtros
  por estado y gravedad, se revisan en una ventana: revisado o descartado, la gravedad y lo que se ha hecho.
- Validación ejecutada: `npm run lint`, `npm run typecheck`, `npm run build` y `npm test` en verde (2 tests nuevos de `fechaHora` y `haceCuanto`). En el
  navegador como admin contra la API local: la lista de usuarios con 12 usuarios en 2 páginas, el filtro de archivados (Dani y Sara), el formulario de
  Dani rellenado y su restauración desde la zona de peligro; los 25 votos en 3 páginas; los 4 Dates con el detalle del cerrado por bloqueo (historial
  "A+ mutuo · por el servidor" y "Bloqueo · por Hugo") y los 2 Planes; en Seguridad, Laia pide ayuda desde la API y la alerta aparece al momento con su
  toast, se marca como atendida y desaparece de las abiertas; un parte se revisa y pasa a Revisado. Sin errores en consola; a 1366 px y a 390 px (las
  tablas como tarjetas y las ventanas como hoja).
- Prompt de IA usado: el del bloque "7 · Backoffice en React" del Sprint 2, que está entero en [AI_LOG.md](AI_LOG.md).

### 2026-11-25 · Sprint 2: la app del móvil (`feat/movil`)

- La app del estudiante en Expo (React Native) con Expo Router, en `apps/movil`, con el mismo aspecto que la web porque todo lo que no se pinta es
  de `packages/shared`: el tema (`tokens` en los `StyleSheet`), los modelos, el cliente HTTP con JWT, los servicios, el socket del chat y, desde
  esta rama, también los textos de tiempo (`utils/tiempo.ts` se ha movido de la web al paquete compartido, con sus tests). Sin funciones nativas.
- **Base** (`_layout.tsx`, `(auth)/`, `(tabs)/`): `configureHttp` con la cabecera `X-Client: movil` (el login devuelve el refresh token en el JSON) y el
  almacén cifrado del teléfono como `refreshTokenStore` (`expo-secure-store`; en el navegador, `localStorage` solo para desarrollo). Al arrancar se
  recupera la sesión antes de pintar y el layout raíz hace de rutas protegidas: sin sesión solo se puede estar en login y registro; con ella, en las
  pestañas (La Orla, Mis Dates y Mi perfil, con iconos de Ionicons). Un admin ve que el backoffice es solo web. Cerrar y abrir la app mantiene la sesión.
- **La Orla** (`orla.tsx`, `ExpedienteCard`): el gesto con `PanResponder` y `Animated` (vienen con React Native): la tarjeta sigue al dedo con rotación,
  los sellos A+ y F aparecen al arrastrar, al soltar más allá del umbral (90 px, el de la web) sale volando y vota, y si no vuelve con un muelle. Solo coge
  el gesto si el dedo va en horizontal, para no robarle el scroll a la pantalla. Botones F y A+, cupo del día, aviso de deshacer con cuenta atrás y la
  pantalla ¡Tenéis Date! en un `Modal`.
- **Mis Dates y el chat** (`dates/index.tsx`, `dates/[dateId].tsx`): las bandejas con su reloj y el avisador (la lista se vuelve a pedir al volver a la
  pestaña), y la conversación con el historial por HTTP, la sala por el socket (`useChat`, el mismo que en la web), el turno, la prórroga, los ✓✓ y los
  separadores de día. Un mensaje de la web llega al móvil al momento, y al revés.
- **Mi perfil y seguridad** (`perfil.tsx`, `components/Seguridad.tsx`): nombre, fecha, titulación (pastillas), qué busco, bio y los contactos de
  confianza (hasta 3, opcionales); la foto se ve pero se cambia desde la web (la galería es una función nativa). Bloquear y mandar un parte desde el
  Expediente y desde el chat, y el botón de ayuda en el chat, en hojas que suben desde abajo (`Modal`), con los mismos textos que la web.
- **Contra el servidor**: `EXPO_PUBLIC_API_URL=https://ea3.upc.edu/api` (la API por HTTPS detrás de nginx); el socket va contra el origen, donde nginx
  reenvía `/socket.io`. Guía en `apps/movil/README.md` (Expo Go, la IP de la wifi en local, el emulador). La prueba con datos móviles queda para el
  despliegue.
- Validación ejecutada: `npm run lint`, `npm run typecheck` (web, móvil y shared) y `npm test` en verde (los tests de tiempo pasan al paquete compartido).
  La app en el navegador (`expo start --web`) a 390 px contra la API local: el login de Laia lleva a las pestañas y al recargar sigue dentro; en La Orla
  aprueba a Nerea (que ya le había dado A+) y sale el ¡Tenéis Date! con el sorteo y el aviso de deshacer con la cuenta atrás; en Mis Dates aparece el
  Date pendiente con "Te toca escribir a ti" y el reloj; en el chat escribe el primer mensaje (pasa a En curso), Nerea responde desde otro socket y el
  mensaje llega al momento con el ✓✓ del leído; Mi perfil rellenado con sus datos y sus 2 contactos; el botón de ayuda enseña "Avisaremos ahora a tus
  2 contactos de confianza". Sin errores en consola. Queda por verla en un teléfono con Expo Go (el gesto físico y el almacén cifrado).
- Prompt de IA usado: el del bloque "8 · La app en el móvil" del Sprint 2, que está entero en [AI_LOG.md](AI_LOG.md).

### 2026-11-25 · Sprint 2: cierre y documentación (`feat/documentacion`)

- **GitHub Actions**: `ci.yml` pasa `npm run lint`, `npm run typecheck` (web, móvil y shared), `npm test` (los tests de la web y del paquete compartido)
  y `npm run build` en cada push y pull request a `main` y `develop`; si es un push, publica la imagen de la web en ghcr.io. La app del móvil no tiene
  imagen: solo se comprueban sus tipos.
- **README y LOGS al día**: el README de la raíz con el stack completo (socket.io-client, expo-secure-store), el de `apps/movil` con cómo arrancarla
  y contra qué API, y este LOGS con el contrato entero del sprint y las tareas de los nueve bloques. El flujo de arquitectura (web, móvil, nginx, API,
  socket.io y MongoDB, y el camino de una petición con JWT) está en el README de
  [STUDATE---DOCKER](https://github.com/mariacazorla/STUDATE---DOCKER); el diagrama de clases, en el de
  [STUDUDATE---BACKEND](https://github.com/mariacazorla/STUDUDATE---BACKEND).
- Prompt de IA usado: el del bloque "9 · Segundo despliegue y cierre" del Sprint 2, que está entero en [AI_LOG.md](AI_LOG.md).

### 2026-11-25 · Segundo despliegue: el fix de nginx (`fix` en `develop`)

- En el primer despliegue en el servidor, al recrear el contenedor de la API con un `.env` nuevo, la API cambió de IP interna y el nginx de la web
  siguió apuntando a la vieja (había resuelto `api` una sola vez, al arrancar): `/api` daba 502 hasta reiniciar la web. Arreglo en
  `apps/web/nginx/studate-app.conf`: `resolver 127.0.0.11 valid=10s` (el DNS de Docker) y el nombre en una variable (`set $api`), con un `rewrite`
  para quitar el prefijo `/api` (con variables, `proxy_pass` no puede quitarlo con la barra final). Probado en local con el compose: tras
  `docker compose up -d --force-recreate api`, `/api/ping` sigue respondiendo y `/socket.io` da 200 sin reiniciar la web.
- La web está desplegada en `https://ea3.upc.edu` y probada desde fuera (login, sesión al recargar, chat, backoffice). El proxy de la UPC no deja
  pasar WebSocket, así que socket.io va por polling; funciona igual.

### 2026-11-25 · La app del móvil a Expo SDK 58 (`chore` en `develop`)

- Al probar en un teléfono, Expo Go de la tienda ya era para el SDK 58 y rechazaba el proyecto (SDK 57, el del Seminario 8); en iPhone no se puede
  instalar un Expo Go antiguo, así que se sube el proyecto: `npx expo install expo@^58 --fix` en `apps/movil`, que deja expo 58.0, expo-router 58,
  React Native 0.88.1, Reanimated 4.7, Gesture Handler 3.3 y React 19.3.0. Como en el monorepo solo puede haber una copia de React, los
  `overrides` de la raíz y la web pasan a React 19.3.0 (la web compila y sus tests pasan igual), y se añaden `react-native` y
  `react-native-reanimated` a los `overrides` para que no quede una copia vieja anidada (pasó al actualizar sin regenerar el lockfile).
- Dos cambios de tipos en el móvil: el `color` de los iconos de las pestañas (el `ColorValue` de 0.88) y el `ref` del `ScrollView` del chat, que
  en 0.88 es un componente de función (`ComponentRef<typeof ScrollView>`).
- Validación ejecutada: `npm run lint`, `npm run typecheck` (web, móvil y shared), `npm test` y `npm run build` de la web en verde; la app arranca
  con `expo start --web` y pinta el login (desde el navegador no puede entrar al servidor por CORS, que es lo esperado: el teléfono no pasa por CORS).
