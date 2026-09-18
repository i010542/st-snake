import { describe, expect, it } from 'vitest';
import { isOutside, isSelfCollision } from '../../src/game/collision';
import { createBoardConfig } from '../../src/game/state';

const board = createBoardConfig();

describe('isOutside', () => {
  it('detects all four walls', () => {
    expect(isOutside({ x: -1, y: 9 }, board)).toBe(true);
    expect(isOutside({ x: 24, y: 9 }, board)).toBe(true);
    expect(isOutside({ x: 12, y: -1 }, board)).toBe(true);
    expect(isOutside({ x: 12, y: 18 }, board)).toBe(true);
    expect(isOutside({ x: 0, y: 0 }, board)).toBe(false);
    expect(isOutside({ x: 23, y: 17 }, board)).toBe(false);
  });
});

describe('isSelfCollision', () => {
  const segments = [
    { x: 5, y: 5 },
    { x: 4, y: 5 },
    { x: 3, y: 5 },
    { x: 3, y: 6 },
  ];

  it('treats any remaining body cell as a collision', () => {
    expect(isSelfCollision({ x: 4, y: 5 }, segments, false)).toBe(true);
    expect(isSelfCollision({ x: 3, y: 5 }, segments, true)).toBe(true);
  });

  it('allows entering the vacated tail when the snake is not growing', () => {
    expect(isSelfCollision({ x: 3, y: 6 }, segments, false)).toBe(false);
  });

  it('does not allow the current tail when growing', () => {
    expect(isSelfCollision({ x: 3, y: 6 }, segments, true)).toBe(true);
  });
});
