import { Outlet } from 'react-router-dom';

// Layout de la app (nested routing): <Outlet /> es el hueco donde React Router pinta la pantalla
// de la ruta hija. En Angular esto era <router-outlet />.
// De momento solo da el relleno y el ancho máximo; el menú llega con el armazón.
export function Layout() {
  return (
    <main className="cuerpo">
      <div className="ancho">
        <Outlet />
      </div>
    </main>
  );
}
