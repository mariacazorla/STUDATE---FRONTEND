import { Navigate, Route, Routes } from 'react-router-dom';

import { ArmazonAdmin, ArmazonEstudiante } from './components/Armazon';
import { Layout } from './components/Layout';
import { DatesAdmin, OrlaAdmin, SeguridadAdmin, UsuariosAdmin } from './pages/admin';
import { MiPerfil, MisDates, Orla } from './pages/estudiante';
import { Login } from './pages/Login';
import { Muestrario } from './pages/Muestrario';
import { Registro } from './pages/Registro';

// Rutas de la app (React Router). Cada zona cuelga de su armazón, que pinta el menú y deja un
// <Outlet /> para la pantalla de cada ruta (nested routing).
export default function App() {
  return (
    <Routes>
      {/* Acceso: las dos pantallas sin menú */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      {/* La app del estudiante */}
      <Route element={<ArmazonEstudiante />}>
        <Route path="/orla" element={<Orla />} />
        <Route path="/dates" element={<MisDates />} />
        <Route path="/perfil" element={<MiPerfil />} />
      </Route>

      {/* El backoffice */}
      <Route path="/admin" element={<ArmazonAdmin />}>
        <Route index element={<Navigate to="/admin/usuarios" replace />} />
        <Route path="usuarios" element={<UsuariosAdmin />} />
        <Route path="orla" element={<OrlaAdmin />} />
        <Route path="dates" element={<DatesAdmin />} />
        <Route path="seguridad" element={<SeguridadAdmin />} />
      </Route>

      {/* El muestrario del CSS global */}
      <Route element={<Layout />}>
        <Route path="/estilos" element={<Muestrario />} />
      </Route>

      {/* Cualquier otra URL va a La Orla */}
      <Route path="*" element={<Navigate to="/orla" replace />} />
    </Routes>
  );
}
