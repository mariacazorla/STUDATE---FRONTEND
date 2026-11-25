import { PantallaVacia } from '../components/PantallaVacia';

// Las pantallas de la app del estudiante que todavía están vacías (La Orla ya tiene la suya en Orla.tsx).
// Cada una se hará en su bloque y pasará a tener su propio fichero.

export function MisDates() {
  return (
    <PantallaVacia
      titulo="Mis Dates"
      texto="Aquí estarán tus Dates pendientes y en curso, con el chat de cada uno."
    />
  );
}

