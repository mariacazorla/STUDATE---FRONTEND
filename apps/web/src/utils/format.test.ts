import { describe, expect, it } from 'vitest';

import { formatDate, initials, truncate } from './format';

describe('format', () => {
  it('truncate() corta el texto largo y añade puntos suspensivos', () => {
    expect(truncate('Siempre en la biblioteca de la EETAC', 10)).toBe('Siempre en...');
    expect(truncate('Corto', 10)).toBe('Corto');
    expect(truncate(undefined)).toBe('');
  });

  it('formatDate() enseña día/mes/año sin que la zona horaria cambie el día', () => {
    expect(formatDate('2003-02-20T00:00:00.000Z')).toBe('20/02/2003');
    expect(formatDate(undefined)).toBe('');
  });

  it('initials() coge la primera y la última palabra del nombre', () => {
    expect(initials('Laia Puig')).toBe('LP');
    expect(initials('Admin Studate')).toBe('AS');
    expect(initials('Usuario')).toBe('U');
  });
});
