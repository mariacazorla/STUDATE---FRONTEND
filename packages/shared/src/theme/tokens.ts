// El tema de Studate: los colores, las tipografías, los radios, las sombras y los espacios del blog
// (Campus Edition), en UN solo fichero. Lo leen las dos apps:
//
//   - La web lo convierte en variables CSS al arrancar (--azul, --r-tarjeta...) y su CSS global usa
//     esas variables. Ninguna pantalla escribe un color a mano.
//   - El móvil usa estos mismos valores en sus StyleSheet.
//
// Así, cambiar el azul aquí lo cambia en la web y en el móvil a la vez.
// Solo hay modo claro: la app no tiene modo oscuro.

export const tokens = {
  // Colores. Los nombres son los del blog
  color: {
    // Marca
    azul: '#1E3FD8',
    noche: '#0B1B3F', // el texto
    rosa: '#EC4899',
    rosaBoton: '#DB2777', // botones y enlaces: tiene más contraste que el rosa sobre blanco
    maiz: '#FFCB05',
    morado: '#5B2BD6', // solo para el degradado de la portada
    niebla: '#FFF0F6',

    // Notas de La Orla y estados
    ok: '#16A34A', // A+
    ko: '#DC2626', // F
    okSuave: '#DCFCE7',
    okTexto: '#15803D',
    koSuave: '#FEE2E2',
    koTexto: '#B91C1C',
    azulSuave: '#E8EDFF',

    // Superficies, textos secundarios y líneas
    fondo: '#FFF7FB',
    blanco: '#FFFFFF',
    gris: '#5B6275',
    linea: '#F0DCE7',
    borde: '#F3E1EA',
    bordeCampo: '#E7D3DE',
    bordeVacio: '#E2C6D5',
    esqueleto: '#F3E4EC',
  },

  // Tipografías (Google Fonts). display: titulares; label: etiquetas y botones, con aire de
  // camiseta universitaria; text: el texto normal
  font: {
    display: 'Anybody',
    label: 'Graduate',
    text: 'Inter',
  },

  // Radios de las esquinas, en píxeles
  radius: {
    tarjeta: 18,
    campo: 12,
    pequeno: 8,
    pastilla: 999, // botones y chips: completamente redondos
  },

  // Sombras, con la sintaxis de CSS box-shadow (React Native también la entiende en boxShadow)
  shadow: {
    tarjeta: '0 10px 28px rgba(11, 27, 63, 0.12)',
    boton: '0 8px 20px rgba(219, 39, 119, 0.35)',
  },

  // Espacios, en píxeles: los huecos y los rellenos salen siempre de esta escala
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },

  // A partir de este ancho la web enseña el menú lateral; por debajo, las pestañas de abajo
  breakpoint: {
    escritorio: 900,
  },
} as const;

export type Tokens = typeof tokens;
export type ColorName = keyof Tokens['color'];
