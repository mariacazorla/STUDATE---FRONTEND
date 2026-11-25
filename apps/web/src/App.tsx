import { Navigate, Route, Routes } from 'react-router-dom';

import { Layout } from './components/Layout';
import { Muestrario } from './pages/Muestrario';

// Rutas de la app (React Router). Todas cuelgan de <Layout />, que deja un <Outlet /> para la
// pantalla de cada ruta (nested routing).
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/estilos" element={<Muestrario />} />
        {/* Cualquier otra URL va al muestrario, que de momento es la única pantalla */}
        <Route path="*" element={<Navigate to="/estilos" replace />} />
      </Route>
    </Routes>
  );
}
