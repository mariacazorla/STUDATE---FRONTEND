import { Navigate, Route, Routes } from 'react-router-dom';

import { Layout } from './components/Layout';
import { Inicio } from './pages/Inicio';

// Rutas de la app (React Router). Todas cuelgan de <Layout />, que pinta la barra de arriba
// y deja un <Outlet /> para la pantalla de cada ruta (nested routing).
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Inicio />} />
        {/* Cualquier otra URL vuelve al inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
