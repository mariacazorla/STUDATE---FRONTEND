# Studate: la app del móvil

La app del estudiante para Android e iOS, hecha con [Expo](https://expo.dev/) (React Native) y Expo
Router, a partir del Seminario 8 de React Native. Es lo mismo que la app del estudiante de la web (La
Orla, Mis Dates con el chat, Mi perfil y la seguridad) con el mismo aspecto, porque el tema (`tokens`),
los modelos, el cliente HTTP con JWT, los servicios de la API y el socket del chat son los de
`packages/shared`: la app solo pinta. Sin funciones nativas en este sprint (la foto de perfil se cambia
desde la web).

El backoffice es solo web: un admin que entra en la app ve un aviso y puede cerrar sesión.

## Arrancarla

Desde la raíz del monorepo, con las dependencias instaladas (`npm install`):

```
cp apps/movil/.env.example apps/movil/.env   # y pon la dirección de la API (ver abajo)
npm run dev:movil
```

Expo enseña un código QR. Con la app **Expo Go** en el teléfono (Android o iOS), se escanea y la app se
abre en el móvil. También se puede abrir en el navegador (`w` en la terminal, o
`npx expo start --web` dentro de `apps/movil`), que es como se ha probado durante el desarrollo.

Si el teléfono no llega al ordenador por la wifi (por ejemplo, con el repo dentro de WSL2, que tiene su
propia red), se arranca con un túnel: `npx expo start --tunnel ngrok` dentro de `apps/movil`. Hay que
poner `ngrok`: desde Expo SDK 58, `--tunnel` a secas usa el túnel propio de Expo y exige una cuenta
(`npx expo login`). El QR que sale funciona desde cualquier red.

## Contra qué API

La dirección de la API se lee del `.env` (`EXPO_PUBLIC_API_URL`), en un solo fichero
(`src/config/environment.ts`):

| Dónde | `EXPO_PUBLIC_API_URL` |
|---|---|
| Teléfono con Expo Go y la API en tu ordenador | `http://<IP de tu ordenador en la wifi>:1337` (el teléfono no entiende `localhost`; los dos en la misma wifi) |
| Emulador de Android | sin variable: `http://10.0.2.2:1337` |
| Navegador | sin variable: `http://localhost:1337` |
| El servidor | `https://ea3.upc.edu/api` (la API por HTTPS detrás de nginx, en `/api`). Así funciona desde cualquier sitio, también con datos móviles |

El chat (socket.io) no cuelga de `/api`: `connectChat()` lo abre contra el origen de esa URL
(`https://ea3.upc.edu`), donde nginx reenvía `/socket.io` a la API.

## La sesión

La app manda la cabecera `X-Client: movil`: con ella el login devuelve el refresh token en el JSON (la web
lo recibe en una cookie HttpOnly, que un teléfono no tiene). Se guarda en el almacén cifrado del teléfono
con `expo-secure-store` (`src/config/sesion.ts`) y al abrir la app se pide un access token nuevo con él
(`authService.restoreSession`): cerrar y abrir la app mantiene la sesión. El access token vive solo en
memoria, como en la web. Al cerrar sesión se borra el refresh token guardado.

En el navegador no hay almacén cifrado y se usa `localStorage`, solo para desarrollo.

## Qué hay

```
src/
  app/                 Las pantallas (Expo Router: cada fichero es una ruta)
    _layout.tsx          Configura el cliente HTTP, recupera la sesión y protege las rutas
    (auth)/              login y registro
    (tabs)/              Las tres pestañas: orla, dates (lista y [dateId], el chat) y perfil
  components/          ui (botón, tarjeta, chip, campo, avatar, vacío), ExpedienteCard (el gesto), Seguridad
  hooks/               useChat (el socket mientras la pantalla está abierta) y useNow (el reloj)
  config/              environment (la URL de la API) y sesion (dónde se guarda el refresh token)
  theme/               estilos comunes con los tokens
```

El gesto de deslizar de La Orla va con `PanResponder` y `Animated`, que vienen con React Native: a la
derecha A+, a la izquierda F, con el sello que aparece al arrastrar y la tarjeta que vuelve si no se pasa
del umbral (90 px, el mismo que en la web).
