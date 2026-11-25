import { useStore } from '@nanostores/react';
import { $user, authService } from '@studate/shared';
import { NavLink, Outlet } from 'react-router-dom';

import { initials } from '../utils/format';
import { Icono } from './Icono';
import type { NombreIcono } from './Icono';
import { Marca } from './Marca';

// Un enlace del menú: a dónde lleva, su texto y su icono
export interface EnlaceMenu {
  to: string;
  texto: string;
  icono: NombreIcono;
}

interface ArmazonProps {
  // 'estudiante' pone las pestañas abajo en pantallas estrechas; 'admin', una fila de botones arriba
  tipo: 'estudiante' | 'admin';
  // La línea pequeña del logo y el rótulo de encima del menú
  subtitulo: string;
  seccion: string;
  enlaces: EnlaceMenu[];
}

// El armazón: lo que rodea a todas las pantallas de una zona (nested routing). El menú se queda
// siempre y <Outlet /> es el hueco donde React Router pinta la pantalla de la ruta hija.
//
// Es el mismo componente para el estudiante y para el admin: solo cambian los enlaces. El menú se
// escribe dos veces en el HTML (lateral y pestañas) y el CSS global enseña uno u otro según el ancho:
//   - a partir de 900 px, el menú lateral
//   - por debajo, una barra arriba con el logo y las pestañas (abajo en la app del estudiante,
//     como en una app de móvil; arriba en el backoffice, que tiene más secciones)
export function Armazon({ tipo, subtitulo, seccion, enlaces }: ArmazonProps) {
  // useStore: el componente se vuelve a pintar solo cuando cambia el usuario con sesión
  const user = useStore($user);

  const salir = (
    <button
      type="button"
      className="btn-icono"
      onClick={() => authService.logout()}
      title="Cerrar sesión"
    >
      <Icono nombre="salir" />
      <span className="solo-lectores">Cerrar sesión</span>
    </button>
  );

  return (
    <div className="armazon">
      {/* Menú lateral: solo en escritorio */}
      <aside className="lateral">
        <Marca subtitulo={subtitulo} />
        <span className="sub">{seccion}</span>

        {/* NavLink le pone aria-current="page" al enlace de la página en la que estoy,
            y el CSS global usa ese atributo para marcarlo */}
        <nav aria-label="Menú">
          {enlaces.map((enlace) => (
            <NavLink key={enlace.to} to={enlace.to}>
              <Icono nombre={enlace.icono} />
              {enlace.texto}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="yo">
            {user.photo ? (
              <img className="av" src={user.photo} alt="" />
            ) : (
              <span className="ini-av">{initials(user.name)}</span>
            )}
            <div>
              <b>{user.name}</b>
              <span>{user.email}</span>
            </div>
            {salir}
          </div>
        )}
      </aside>

      {/* Barra de arriba: solo en pantallas estrechas */}
      <header className="arriba">
        <Marca subtitulo={subtitulo} />
        <div className="der">{salir}</div>
      </header>

      <div className="contenido">
        {tipo === 'admin' && (
          <nav className="navbo" aria-label="Secciones del backoffice">
            {enlaces.map((enlace) => (
              <NavLink key={enlace.to} to={enlace.to}>
                {enlace.texto}
              </NavLink>
            ))}
          </nav>
        )}

        <main className="cuerpo">
          <div className="ancho">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Pestañas de abajo: solo en pantallas estrechas y en la app del estudiante */}
      {tipo === 'estudiante' && (
        <nav className="abajo" aria-label="Menú">
          {enlaces.map((enlace) => (
            <NavLink key={enlace.to} to={enlace.to}>
              <Icono nombre={enlace.icono} />
              {enlace.texto}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

// Los menús de las dos zonas. Están aquí, y no dentro de cada pantalla, para verlos de un vistazo
const ENLACES_ESTUDIANTE: EnlaceMenu[] = [
  { to: '/orla', texto: 'La Orla', icono: 'orla' },
  { to: '/dates', texto: 'Mis Dates', icono: 'chat' },
  { to: '/perfil', texto: 'Mi perfil', icono: 'usuario' },
];

const ENLACES_ADMIN: EnlaceMenu[] = [
  { to: '/admin/usuarios', texto: 'Usuarios', icono: 'usuarios' },
  { to: '/admin/orla', texto: 'La Orla', icono: 'orla' },
  { to: '/admin/dates', texto: 'Dates y Planes', icono: 'calendario' },
  { to: '/admin/seguridad', texto: 'Seguridad', icono: 'escudo' },
];

// El armazón de la app del estudiante: La Orla, Mis Dates y Mi perfil
export function ArmazonEstudiante() {
  return (
    <Armazon
      tipo="estudiante"
      subtitulo="CAMPUS EDITION"
      seccion="Secretaría virtual"
      enlaces={ENLACES_ESTUDIANTE}
    />
  );
}

// El armazón del backoffice: Usuarios, La Orla, Dates y Planes y Seguridad
export function ArmazonAdmin() {
  return (
    <Armazon
      tipo="admin"
      subtitulo="BACKOFFICE"
      seccion="Administración"
      enlaces={ENLACES_ADMIN}
    />
  );
}
