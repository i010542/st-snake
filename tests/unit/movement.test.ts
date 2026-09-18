import { describe, expect, it } from 'vitest';
import { moveSnake, nextHead } from '../../src/game/movement';
import type { Snake } from '../../src/game/types';

const baseSnake: Snake = {
  segments: [
    { x: 12, y: 9 },
    { x: 11, y: 9 },
    { x: 10, y: 9 },
  ],
  direction: 'right',
  pendingDirection: 'up',
};

describe('nextHead', () => {
  it('moves one cell in each cardinal direction', () => {
    expect(nextHead({ x: 5, y: 5 }, 'up')).toEqual({ x: 5, y: 4 });
    expect(nextHead({ x: 5, y: 5 }, 'down')).toEqual({ x: 5, y: 6 });
    expect(nextHead({ x: 5, y: 5 }, 'left')).toEqual({ x: 4, y: 5 });
    expect(nextHead({ x: 5, y: 5 }, 'right')).toEqual({ x: 6, y: 5 });
  });
});

describe('moveSnake', () => {
  it('removes the tail on a normal step and clears the input lock', () => {
    const next = moveSnake(baseSnake, 'right', false);
    expect(next.segments).toEqual([
      { x: 13, y: 9 },
      { x: 12, y: 9 },
      { x: 11, y: 9 },
    ]);
    expect(next.direction).toBe('right');
    expect(next.pendingDirection).toBeNull();
  });

  it('keeps the tail when growing so length increases by one', () => {
    const next = moveSnake(baseSnake, 'right', true);
    expect(next.segments).toHaveLength(4);
    expect(next.segments).toEqual([
      { x: 13, y: 9 },
      { x: 12, y: 9 },
      { x: 11, y: 9 },
      { x: 10, y: 9 },
    ]);
    expect(next.pendingDirection).toBeNull();
  });
});
