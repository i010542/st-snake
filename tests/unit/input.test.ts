import { describe, expect, it } from 'vitest';
import { isOpposite, mapKeyToAction, queueDirection } from '../../src/game/input';
import type { Snake } from '../../src/game/types';

function snake(direction: Snake['direction'], pending: Snake['pendingDirection'] = null): Snake {
  return {
    segments: [
      { x: 12, y: 9 },
      { x: 11, y: 9 },
      { x: 10, y: 9 },
    ],
    direction,
    pendingDirection: pending,
  };
}

describe('mapKeyToAction', () => {
  it('maps arrows, WASD in both cases, pause and confirm keys', () => {
    expect(mapKeyToAction('ArrowUp')).toEqual({ type: 'direction', direction: 'up' });
    expect(mapKeyToAction('ArrowDown')).toEqual({ type: 'direction', direction: 'down' });
    expect(mapKeyToAction('ArrowLeft')).toEqual({ type: 'direction', direction: 'left' });
    expect(mapKeyToAction('ArrowRight')).toEqual({ type: 'direction', direction: 'right' });
    expect(mapKeyToAction('w')).toEqual({ type: 'direction', direction: 'up' });
    expect(mapKeyToAction('A')).toEqual({ type: 'direction', direction: 'left' });
    expect(mapKeyToAction('s')).toEqual({ type: 'direction', direction: 'down' });
    expect(mapKeyToAction('D')).toEqual({ type: 'direction', direction: 'right' });
    expect(mapKeyToAction('p')).toEqual({ type: 'togglePause' });
    expect(mapKeyToAction('Escape')).toEqual({ type: 'togglePause' });
    expect(mapKeyToAction('Enter')).toEqual({ type: 'confirm' });
    expect(mapKeyToAction(' ')).toEqual({ type: 'confirm' });
    expect(mapKeyToAction('x')).toBeNull();
  });
});

describe('isOpposite', () => {
  it('treats up/down and left/right as opposite pairs', () => {
    expect(isOpposite('up', 'down')).toBe(true);
    expect(isOpposite('left', 'right')).toBe(true);
    expect(isOpposite('right', 'up')).toBe(false);
  });
});

describe('queueDirection', () => {
  it('rejects the opposite of the committed direction and does not lock the step', () => {
    const next = queueDirection(snake('right'), 'left');
    expect(next.pendingDirection).toBeNull();
    expect(next).toEqual(snake('right'));
  });

  it('ignores the same direction and does not lock the step', () => {
    const next = queueDirection(snake('right'), 'right');
    expect(next.pendingDirection).toBeNull();
  });

  it('accepts a legal turn after an ignored reverse input', () => {
    const afterIllegal = queueDirection(snake('right'), 'left');
    const afterLegal = queueDirection(afterIllegal, 'up');
    expect(afterLegal.pendingDirection).toBe('up');
  });

  it('keeps only the first legal turn in a step', () => {
    const afterFirst = queueDirection(snake('right'), 'up');
    const afterSecond = queueDirection(afterFirst, 'left');
    expect(afterFirst.pendingDirection).toBe('up');
    expect(afterSecond.pendingDirection).toBe('up');
  });

  it('judges legality against snake.direction, not a previous pending value', () => {
    const pendingUp = queueDirection(snake('right'), 'up');
    const stillLocked = queueDirection(pendingUp, 'down');
    expect(stillLocked.pendingDirection).toBe('up');
  });
});
