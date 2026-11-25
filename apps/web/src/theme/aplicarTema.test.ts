import { tokens } from '@studate/shared';
import { describe, expect, it } from 'vitest';

import { aplicarTema, themeVariables } from './aplicarTema';

describe('aplicarTema', () => {
  it('convierte cada token en una variable CSS con su nombre en kebab-case', () => {
    const variables = themeVariables();

    expect(variables['--azul']).toBe(tokens.color.azul);
    expect(variables['--rosa-boton']).toBe(tokens.color.rosaBoton);
    expect(variables['--r-tarjeta']).toBe('18px');
    expect(variables['--esp-lg']).toBe('16px');
    expect(variables['--sombra-tarjeta']).toBe(tokens.shadow.tarjeta);
    expect(variables['--f-display']).toContain('"Anybody"');
  });

  it('hay una variable por cada color del tema', () => {
    const variables = themeVariables();
    const colors = Object.keys(tokens.color);

    expect(Object.keys(variables).filter((name) => !/^--(f|r|sombra|esp)-/.test(name))).toHaveLength(
      colors.length,
    );
  });

  it('deja las variables puestas en <html>, donde las lee el CSS global', () => {
    aplicarTema();

    expect(document.documentElement.style.getPropertyValue('--noche')).toBe(tokens.color.noche);
  });
});
