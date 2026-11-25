import { describe, expect, it } from 'vitest';

import { SWIPE_THRESHOLD, voteFromDrag } from './swipe';

describe('voteFromDrag', () => {
  it('a la derecha, pasado el umbral, es un A+', () => {
    expect(voteFromDrag(SWIPE_THRESHOLD)).toBe('A+');
    expect(voteFromDrag(SWIPE_THRESHOLD + 50)).toBe('A+');
  });

  it('a la izquierda, pasado el umbral, es una F', () => {
    expect(voteFromDrag(-SWIPE_THRESHOLD)).toBe('F');
    expect(voteFromDrag(-SWIPE_THRESHOLD - 50)).toBe('F');
  });

  it('un arrastre corto (por debajo del umbral) no vota', () => {
    expect(voteFromDrag(0)).toBeNull();
    expect(voteFromDrag(SWIPE_THRESHOLD - 1)).toBeNull();
    expect(voteFromDrag(-(SWIPE_THRESHOLD - 1))).toBeNull();
  });
});
