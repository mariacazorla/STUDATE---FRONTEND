import { PantallaVacia } from '../../components/PantallaVacia';

// Las pantallas del backoffice que todavía están vacías: cada una pasa a su propio fichero en su tarea

export function SeguridadAdmin() {
  return (
    <PantallaVacia
      titulo="Seguridad"
      texto="Las alertas de ayuda en tiempo real y los partes, con su gravedad."
    />
  );
}
