import { Navigate, Route, Routes } from 'react-router-dom';

import { ArmazonAdmin, ArmazonEstudiante } from './components/Armazon';
import { Layout } from './components/Layout';
import { SoloConSesion, SoloRol, SoloSinSesion } from './components/RutasProtegidas';
import { DatesAdmin, OrlaAdmin, SeguridadAdmin, UsuariosAdmin } from './pages/admin';
import { MisDates } from './pages/estudiante';
import { MiPerfil } from './pages/MiPerfil';
import { Orla } from './pages/Orla';
import { Login } from './pages/Login';
import { Muestrario } from './pages/Muestrario';
import { Registro } from './pages/Registro';

// Rutas de la app (React Router), con rutas anidadas (nested routing). Cada grupo cuelga de:
//   - una ruta protegida, que decide si se puede entrar (ver components/RutasProtegidas.tsx)
//   - su armazón, que pinta el menú y deja un <Outlet /> para la pantalla
//
// Solo hay dos roles. El estudiante (rol 'user') entra en /orla y el admin, en /admin; cada uno
// vuelve a su pantalla de entrada si abre una ruta del otro.
export default function App() {
  return (
    <Routes>
      {/* Acceso: solo sin sesión. Con sesión, cada uno va a su pantalla de entrada */}
      <Route element={<SoloSinSesion />}>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
      </Route>

      {/* Todo lo demás pide sesión; sin ella, al login */}
      <Route element={<SoloConSesion />}>
        {/* La app del estudiante */}
        <Route element={<SoloRol role="user" />}>
          <Route element={<ArmazonEstudiante />}>
            <Route path="/orla" element={<Orla />} />
            <Route path="/dates" element={<MisDates />} />
            <Route path="/perfil" element={<MiPerfil />} />
          </Route>
        </Route>

        {/* El backoffice: solo admin */}
        <Route element={<SoloRol role="admin" />}>
          <Route path="/admin" element={<ArmazonAdmin />}>
            <Route index element={<Navigate to="/admin/usuarios" replace />} />
            <Route path="usuarios" element={<UsuariosAdmin />} />
            <Route path="orla" element={<OrlaAdmin />} />
            <Route path="dates" element={<DatesAdmin />} />
            <Route path="seguridad" element={<SeguridadAdmin />} />
          </Route>
        </Route>
      </Route>

      {/* El muestrario del CSS global: no enseña datos, así que no pide sesión */}
      <Route element={<Layout />}>
        <Route path="/estilos" element={<Muestrario />} />
      </Route>

      {/* Cualquier otra URL va a La Orla, y de ahí las rutas protegidas llevan a cada uno a su
          sitio: al login sin sesión, y al backoffice si es admin */}
      <Route path="*" element={<Navigate to="/orla" replace />} />
    </Routes>
  );
}
