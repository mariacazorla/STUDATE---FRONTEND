import type { ReactNode } from 'react';

// Los iconos de la app: dibujos de línea en SVG, los mismos de las pantallas acordadas.
// Van dentro del código (no son ficheros aparte) para que cojan el color del texto que tienen
// alrededor: la clase global .ico los pinta con stroke: currentColor.
const DIBUJOS = {
  orla: (
    <>
      <path d="M2 9l10-5 10 5-10 5z" />
      <path d="M6 11v5c3 2.5 9 2.5 12 0v-5" />
    </>
  ),
  chat: <path d="M4 5h16v11H10l-5 4v-4H4z" />,
  usuario: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  usuarios: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 7M18 13.5a6 6 0 0 1 4 6" />
    </>
  ),
  calendario: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
  escudo: (
    <>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="M12 8v4M12 15.5v.5" />
    </>
  ),
  salir: <path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10" />,
  enviar: <path d="M4 12h14M13 6l6 6-6 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  deshacer: (
    <>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h11a5 5 0 0 1 0 10h-3" />
    </>
  ),
  // Las bandejas de Mis Dates: fuego (Pendientes) y corazón (En curso), y el reloj del tiempo que queda
  fuego: <path d="M12 3c1 3 4 4.5 4 8.5a4 4 0 0 1-8 0c0-1.5.5-2.5 1.5-3.5.2 1.5 1 2.5 2 2.5.5-2.5-.5-5 .5-7.5z" />,
  corazon: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />,
  reloj: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  volver: <path d="M15 5l-7 7 7 7" />,
} satisfies Record<string, ReactNode>;

export type NombreIcono = keyof typeof DIBUJOS;

interface IconoProps {
  nombre: NombreIcono;
}

// aria-hidden: el icono es decoración; lo que lee un lector de pantalla es el texto de al lado
export function Icono({ nombre }: IconoProps) {
  return (
    <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
      {DIBUJOS[nombre]}
    </svg>
  );
}
