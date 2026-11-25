import { describe, expect, it } from 'vitest';

import { empezoEl, etiquetaDia, horaCorta, restanteCorto, restanteLargo } from './tiempo';

const HORA = 60 * 60 * 1000;
const MINUTO = 60 * 1000;

describe('tiempo', () => {
  it('restanteCorto() enseña horas si queda más de una hora y minutos si no', () => {
    expect(restanteCorto(23 * HORA + 12 * MINUTO)).toBe('23 h');
    expect(restanteCorto(45 * MINUTO)).toBe('45 min');
    expect(restanteCorto(0)).toBe('0 min');
  });

  it('restanteLargo() enseña horas y minutos', () => {
    expect(restanteLargo(23 * HORA + 12 * MINUTO)).toBe('23 h 12 min');
    expect(restanteLargo(12 * MINUTO)).toBe('12 min');
  });

  it('horaCorta() enseña la hora con dos cifras', () => {
    const fecha = new Date(2026, 10, 25, 9, 5);
    expect(horaCorta(fecha.toISOString())).toBe('09:05');
  });

  it('etiquetaDia() distingue hoy, ayer y una fecha', () => {
    const ahora = new Date(2026, 10, 25, 18, 0);
    expect(etiquetaDia(new Date(2026, 10, 25, 8, 0).toISOString(), ahora)).toBe('HOY');
    expect(etiquetaDia(new Date(2026, 10, 24, 23, 59).toISOString(), ahora)).toBe('AYER');
    expect(etiquetaDia(new Date(2026, 10, 12, 10, 0).toISOString(), ahora)).toBe('12/11/2026');
  });

  it('empezoEl() redacta cuándo empezó la conversación', () => {
    const ahora = new Date(2026, 10, 25, 18, 0);
    expect(empezoEl(new Date(2026, 10, 24, 16, 43).toISOString(), ahora)).toBe('ayer a las 16:43');
    expect(empezoEl(new Date(2026, 10, 12, 16, 43).toISOString(), ahora)).toBe(
      'el 12/11/2026 a las 16:43',
    );
  });
});
