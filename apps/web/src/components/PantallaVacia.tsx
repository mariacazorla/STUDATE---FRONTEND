interface PantallaVaciaProps {
  titulo: string;
  // Qué habrá en esta pantalla, en una frase
  texto: string;
}

// Una pantalla que todavía no tiene contenido: su título y un aviso de qué llegará.
// Sirve para dejar hechas las rutas y el menú antes de hacer cada pantalla de verdad.
export function PantallaVacia({ titulo, texto }: PantallaVaciaProps) {
  return (
    <div className="pila">
      <h1 className="t1">{titulo}</h1>
      <div className="vacio">
        <b>Esta pantalla llega pronto.</b>
        <span className="sua">{texto}</span>
      </div>
    </div>
  );
}
