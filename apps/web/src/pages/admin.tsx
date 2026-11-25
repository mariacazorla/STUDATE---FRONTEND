import { PantallaVacia } from '../components/PantallaVacia';

// Las pantallas del backoffice, solo para el admin. De momento están vacías: se rehacen en React
// en el bloque del backoffice, y cada una pasará a tener su propio fichero.

export function UsuariosAdmin() {
  return (
    <PantallaVacia
      titulo="Usuarios"
      texto="Lista de usuarios con búsqueda, filtros y paginación del servidor, y su formulario."
    />
  );
}

export function OrlaAdmin() {
  return <PantallaVacia titulo="La Orla" texto="Los votos de La Orla, con sus filtros." />;
}

export function DatesAdmin() {
  return (
    <PantallaVacia
      titulo="Dates y Planes"
      texto="Los Dates con su historial y los Planes del Cambio de Aula."
    />
  );
}

export function SeguridadAdmin() {
  return (
    <PantallaVacia
      titulo="Seguridad"
      texto="Las alertas de ayuda en tiempo real y los partes, con su gravedad."
    />
  );
}
