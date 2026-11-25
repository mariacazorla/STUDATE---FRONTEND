import { useEffect, useState } from 'react';

// Cuántos segundos dura el aviso de deshacer (igual que la ventana de deshacer de la API)
const SEGUNDOS = 10;

interface UndoToastProps {
  // Texto de qué se acaba de votar, por ejemplo "Has aprobado a Pau"
  mensaje: string;
  onUndo: () => void;
  // Se llama cuando pasan los 10 s sin deshacer: el aviso desaparece
  onExpire: () => void;
}

// El aviso de deshacer: aparece tras votar, con una cuenta atrás de 10 segundos en un anillo. Si se
// pulsa "Deshacer", el padre deshace el voto; si pasan los 10 s, desaparece solo.
export function UndoToast({ mensaje, onUndo, onExpire }: UndoToastProps) {
  const [restantes, setRestantes] = useState(SEGUNDOS);

  useEffect(() => {
    // Se calcula el tiempo que queda a partir de una hora de fin fija, para que no se desajuste.
    // Al llegar a 0 se avisa al padre (fuera del actualizador de estado, para no cambiar su estado
    // mientras React pinta). El intervalo se limpia al desmontar (el key reinicia el componente por voto)
    const fin = Date.now() + SEGUNDOS * 1000;
    const id = setInterval(() => {
      const quedan = Math.ceil((fin - Date.now()) / 1000);
      if (quedan <= 0) {
        clearInterval(id);
        setRestantes(0);
        onExpire();
      } else {
        setRestantes(quedan);
      }
    }, 250);

    return () => clearInterval(id);
  }, [onExpire]);

  // El anillo se vacía a medida que pasa el tiempo (de 100% a 0)
  const porcentaje = (restantes / SEGUNDOS) * 100;

  return (
    <div className="toast card" role="status">
      <span className="anillo" style={{ background: `conic-gradient(var(--azul) ${porcentaje}%, var(--azul-suave) ${porcentaje}% 100%)` }}>
        <span>{restantes}</span>
      </span>
      <span className="toast-texto">{mensaje}</span>
      <button type="button" className="btn2" onClick={onUndo}>
        Deshacer
      </button>
    </div>
  );
}
