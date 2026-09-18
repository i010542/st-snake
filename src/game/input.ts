import type { Direction, InputAction, Snake } from './types';

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export function isOpposite(a: Direction, b: Direction): boolean {
  return OPPOSITE[a] === b;
}

export function mapKeyToAction(key: string): InputAction | null {
  switch (key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      return { type: 'direction', direction: 'up' };
    case 'ArrowDown':
    case 's':
    case 'S':
      return { type: 'direction', direction: 'down' };
    case 'ArrowLeft':
    case 'a':
    case 'A':
      return { type: 'direction', direction: 'left' };
    case 'ArrowRight':
    case 'd':
    case 'D':
      return { type: 'direction', direction: 'right' };
    case 'p':
    case 'P':
    case 'Escape':
      return { type: 'togglePause' };
    case 'Enter':
    case ' ':
      return { type: 'confirm' };
    default:
      return null;
  }
}

export function queueDirection(snake: Snake, requested: Direction): Snake {
  if (snake.pendingDirection !== null) {
    return snake;
  }

  if (requested === snake.direction) {
    return snake;
  }

  if (isOpposite(requested, snake.direction)) {
    return snake;
  }

  return {
    ...snake,
    pendingDirection: requested,
  };
}
