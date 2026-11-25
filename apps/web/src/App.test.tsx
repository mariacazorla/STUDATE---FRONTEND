import { $user, configureHttp } from '@studate/shared';
import type { User } from '@studate/shared';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import App from './App';
import { ToastProvider } from './context/ToastContext';

const estudiante: User = { _id: 'u1', name: 'Laia Puig', email: 'laia@example.com', role: 'user' };
const admin: User = { _id: 'a1', name: 'Admin Studate', email: 'admin@example.com', role: 'admin' };

// Pinta la app como si el navegador estuviera en esa URL. MemoryRouter es un router que guarda
// la URL en memoria: es el que se usa en los tests en lugar de BrowserRouter
function abrir(url: string) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </MemoryRouter>,
  );
}

// El título de la pantalla que se está viendo
const titulo = () => screen.getByRole('heading', { level: 1 }).textContent;

beforeEach(() => {
  configureHttp({ apiUrl: 'http://api.test', credentials: 'include' });
  $user.set(null);
});

afterEach(() => cleanup());

describe('rutas según el rol', () => {
  it('sin sesión, una pantalla protegida lleva al login', () => {
    abrir('/orla');
    expect(titulo()).toBe('Entrar');
  });

  it('sin sesión, el backoffice también lleva al login', () => {
    abrir('/admin/usuarios');
    expect(titulo()).toBe('Entrar');
  });

  it('sin sesión se puede abrir el registro', () => {
    abrir('/registro');
    expect(titulo()).toBe('Crear cuenta');
  });

  it('un estudiante entra en La Orla', () => {
    $user.set(estudiante);
    abrir('/orla');
    expect(titulo()).toBe('La Orla');
  });

  it('un estudiante que abre /admin vuelve a La Orla', () => {
    $user.set(estudiante);
    abrir('/admin');
    expect(titulo()).toBe('La Orla');
  });

  it('un estudiante que abre una pantalla del backoffice vuelve a La Orla', () => {
    $user.set(estudiante);
    abrir('/admin/seguridad');
    expect(titulo()).toBe('La Orla');
  });

  it('un admin entra en el backoffice, en Usuarios', () => {
    $user.set(admin);
    abrir('/admin');
    expect(titulo()).toBe('Usuarios');
  });

  it('un admin que abre una pantalla del estudiante vuelve al backoffice', () => {
    $user.set(admin);
    abrir('/dates');
    expect(titulo()).toBe('Usuarios');
  });

  it('con sesión, el login lleva a la pantalla de entrada de cada rol', () => {
    $user.set(estudiante);
    abrir('/login');
    expect(titulo()).toBe('La Orla');

    cleanup();
    $user.set(admin);
    abrir('/login');
    expect(titulo()).toBe('Usuarios');
  });

  it('una URL que no existe lleva a cada uno a su sitio', () => {
    $user.set(admin);
    abrir('/no-existe');
    expect(titulo()).toBe('Usuarios');
  });

  it('el menú del estudiante no enseña el backoffice', () => {
    $user.set(estudiante);
    abrir('/orla');

    expect(screen.queryByText('Usuarios')).toBeNull();
    expect(screen.getAllByText('Mis Dates').length).toBeGreaterThan(0);
  });

  it('al perder la sesión, la pantalla protegida se cambia por el login', async () => {
    $user.set(estudiante);
    abrir('/dates');
    expect(titulo()).toBe('Mis Dates');

    // Lo que hace el cliente HTTP cuando no puede renovar el token, o el botón de cerrar sesión
    $user.set(null);

    expect(await screen.findByRole('heading', { level: 1, name: 'Entrar' })).toBeTruthy();
  });
});
