import { authService, configureHttp } from '@studate/shared';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { environment } from './config/environment';
import { ToastProvider } from './context/ToastContext';
import { aplicarTema } from './theme/aplicarTema';
import './styles/global.css';
import './styles/componentes.css';

// El tema de @studate/shared se vuelca como variables CSS antes de pintar nada: así el primer
// render ya sale con los colores y las tipografías de Studate
aplicarTema();

// El cliente HTTP es compartido con la app del móvil, así que cada app le dice cómo es su
// plataforma. La web: la dirección de la API y credentials: 'include', para que el navegador envíe
// y acepte la cookie HttpOnly del refresh token (JavaScript nunca llega a verla).
configureHttp({ apiUrl: environment.apiUrl, credentials: 'include' });

// Antes de pintar se recupera la sesión. El access token solo vive en memoria y al recargar la
// página se ha perdido: restoreSession() pide uno nuevo con la cookie y después el usuario. Si no
// hay cookie o ha caducado, no pasa nada: se pinta igual, sin usuario, y las rutas llevan al login.
// Se espera a que termine para que la primera pantalla ya sea la buena (en Angular era el
// provideAppInitializer): si se pintara antes, quien recarga vería un momento el login.
authService.restoreSession().then(() => {
  // Punto de entrada (CSR): el index.html solo trae <div id="root"></div> y React pinta la app ahí.
  // Los "providers" envuelven la app: BrowserRouter da las rutas y ToastProvider el contexto global.
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <ToastProvider>
          <App />
        </ToastProvider>
      </BrowserRouter>
    </StrictMode>,
  );
});
