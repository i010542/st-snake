import type { Direction, Point, Snake } from './types';

export function nextHead(head: Point, direction: Direction): Point {
  switch (direction) {
    case 'up':
      return { x: head.x, y: head.y - 1 };
    case 'down':
      return { x: head.x, y: head.y + 1 };
    case 'left':
      return { x: head.x - 1, y: head.y };
    case 'right':
      return { x: head.x + 1, y: head.y };
  }
}

export function moveSnake(
  snake: Snake,
  effectiveDirection: Direction,
  willGrow: boolean,
): Snake {
  const head = nextHead(snake.segments[0], effectiveDirection);
  const body = willGrow ? snake.segments : snake.segments.slice(0, -1);

  return {
    segments: [head, ...body.map((point) => ({ x: point.x, y: point.y }))],
    direction: effectiveDirection,
    pendingDirection: null,
  };
}
