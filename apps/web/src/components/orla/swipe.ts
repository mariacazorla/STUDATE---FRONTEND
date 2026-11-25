import type { GradeValue } from '@studate/shared';

// Cuántos píxeles hay que arrastrar para que el deslizamiento cuente como un voto. Por debajo, la
// tarjeta vuelve a su sitio y no vota: así un arrastre corto o un clic no votan sin querer.
export const SWIPE_THRESHOLD = 90;

// A partir de cuánto se gira la tarjeta al arrastrar: a más desplazamiento, más inclinación (suave)
export const SWIPE_ROTATION = 18;

// Qué voto sale de un desplazamiento horizontal: a la derecha es A+, a la izquierda F, en el medio nada.
// La misma regla vale para el ratón y para el dedo
export function voteFromDrag(dx: number): GradeValue | null {
  if (dx >= SWIPE_THRESHOLD) {
    return 'A+';
  }
  if (dx <= -SWIPE_THRESHOLD) {
    return 'F';
  }
  return null;
}

// Si el usuario ha pedido menos animaciones (sistema): entonces no se hace volar la tarjeta, se vota y ya
export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}
