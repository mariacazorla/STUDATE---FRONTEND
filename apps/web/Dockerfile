# Imagen de la web de Studate, en dos etapas (como en el Seminario 10):
#
#   1. build   instala las dependencias de la web y de packages/shared y compila con Vite a dist/
#   2. nginx   sirve dist/ y hace de puerta de entrada: /api y /socket.io van a la API
#
# Se construye desde la RAÍZ del monorepo, no desde apps/web, porque la web importa @studate/shared y
# npm workspaces tiene que ver las tres carpetas:
#
#     docker build -f apps/web/Dockerfile -t studate-web .
#
# npm ci --workspace instala solo lo que necesita la web (y shared): Expo y lo de apps/movil no entran.
#
# La URL de la API va compilada dentro de la imagen (Vite la incrusta al compilar). Es /api, una ruta
# relativa: la web y la API salen por el mismo nginx, así que vale para cualquier servidor sin reconstruir
# la imagen, y no hay CORS.

FROM node:24-alpine AS build
WORKDIR /app
# Primero solo los package.json y el lock: si no cambian, Docker reutiliza la capa de npm ci
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci --workspace @studate/web --workspace @studate/shared
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build --workspace @studate/web

FROM nginx:1.29-alpine
# La configuración propia sustituye a la de nginx por defecto (ver nginx.conf)
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
