import { PantallaVacia } from '../components/PantallaVacia';

// Las pantallas de la app del estudiante. De momento están vacías: cada una se hará en su bloque
// y pasará a tener su propio fichero. Aquí ya existen para que el menú y las rutas funcionen.

export function Orla() {
  return (
    <PantallaVacia
      titulo="La Orla"
      texto="Aquí irás viendo Expedientes de gente de tu campus para ponerles A+ o F."
    />
  );
}

export function MisDates() {
  return (
    <PantallaVacia
      titulo="Mis Dates"
      texto="Aquí estarán tus Dates pendientes y en curso, con el chat de cada uno."
    />
  );
}

export function MiPerfil() {
  return (
    <PantallaVacia
      titulo="Mi perfil"
      texto="Aquí podrás editar tu Expediente, tu foto y tus contactos de confianza."
    />
  );
}
