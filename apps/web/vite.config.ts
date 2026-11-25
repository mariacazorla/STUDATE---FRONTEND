import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
// El código de packages/shared no necesita nada aquí: npm workspaces lo enlaza en node_modules
// como @studate/shared y Vite lo compila igual que el código de src/.
export default defineConfig({
  plugins: [react()],
  server: {
    // El puerto es fijo porque el backend solo acepta peticiones de los orígenes de su CORS_ORIGINS
    // (http://localhost:5173). Si está ocupado, Vite avisa en lugar de coger otro
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
  },
});
