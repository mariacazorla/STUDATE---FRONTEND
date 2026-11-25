import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  // El id del input que va dentro: une la etiqueta con su campo (al pulsar la etiqueta, se enfoca)
  htmlFor: string;
  error?: string;
  hint?: string;
  // Marca el campo en rojo sin texto debajo (cuando el motivo ya se explica en otro campo)
  invalid?: boolean;
  children: ReactNode;
}

// Una etiqueta + el input que le pasen como children + su mensaje de error.
// Evita repetir el mismo bloque de HTML en cada campo de los formularios.
// Usa la clase global .campo; con un error, .mal pinta el borde en rojo.
export function Field({ label, htmlFor, error, hint, invalid, children }: FieldProps) {
  return (
    <div className={error || invalid ? 'campo mal' : 'campo'}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && !error && <span className="ayuda">{hint}</span>}
      {error && <span className="error">{error}</span>}
    </div>
  );
}
