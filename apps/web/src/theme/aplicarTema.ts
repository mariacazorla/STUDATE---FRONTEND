import { tokens } from '@studate/shared';

// Vuelca el tema de @studate/shared como variables CSS en <html>, para que el CSS global pueda
// usarlas: tokens.color.rosaBoton pasa a ser var(--rosa-boton), tokens.radius.tarjeta pasa a ser
// var(--r-tarjeta)... Se llama UNA vez en main.tsx, antes del primer render.
//
// Así los colores y las medidas están escritos en un solo sitio (tokens.ts), que es el mismo que
// usa la app del móvil. En los .css de la web no hay ni un color escrito a mano.

// rosaBoton -> rosa-boton: los nombres en CSS van en minúsculas y con guiones
const kebab = (name: string) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

// Si la tipografía de Google Fonts no llega a cargar, el navegador usa la siguiente de la lista
const FALLBACKS: Record<keyof typeof tokens.font, string> = {
  display: '"Arial Black", system-ui, sans-serif',
  label: '"Rockwell", Georgia, serif',
  text: 'system-ui, -apple-system, "Segoe UI", sans-serif',
};

// Las variables que genera, con su prefijo:
//   color    --azul, --rosa-boton, --ok-suave...   (sin prefijo: son las que más se usan)
//   font     --f-display, --f-label, --f-text
//   radius   --r-tarjeta, --r-campo, --r-pequeno, --r-pastilla
//   shadow   --sombra-tarjeta, --sombra-boton
//   space    --esp-xs, --esp-sm, --esp-md, --esp-lg, --esp-xl, --esp-xxl
export function themeVariables(): Record<string, string> {
  const variables: Record<string, string> = {};

  for (const [name, value] of Object.entries(tokens.color)) {
    variables[`--${kebab(name)}`] = value;
  }
  for (const [name, family] of Object.entries(tokens.font)) {
    variables[`--f-${name}`] = `"${family}", ${FALLBACKS[name as keyof typeof tokens.font]}`;
  }
  for (const [name, value] of Object.entries(tokens.radius)) {
    variables[`--r-${kebab(name)}`] = `${value}px`;
  }
  for (const [name, value] of Object.entries(tokens.shadow)) {
    variables[`--sombra-${kebab(name)}`] = value;
  }
  for (const [name, value] of Object.entries(tokens.space)) {
    variables[`--esp-${name}`] = `${value}px`;
  }

  return variables;
}

export function aplicarTema(): void {
  const root = document.documentElement;

  for (const [name, value] of Object.entries(themeVariables())) {
    root.style.setProperty(name, value);
  }
}
