// Ajustes de la app. UN solo fichero: la URL de la API se lee aquí y en ningún sitio más.
// Viene del .env (VITE_API_URL): Vite solo deja pasar al código las variables que empiezan por
// VITE_ y las incrusta al compilar. Así la misma web sirve en local (http://localhost:1337) y en
// el servidor (/api, detrás de nginx) sin tocar el código.
export const environment = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:1337',
};
