import type { BoardConfig, Point } from './types';
import { pointsEqual } from './types';

export function isOutside(point: Point, board: BoardConfig): boolean {
  return (
    point.x < 0 ||
    point.y < 0 ||
    point.x >= board.columns ||
    point.y >= board.rows
  );
}

export function isSelfCollision(
  next: Point,
  segments: readonly Point[],
  willGrow: boolean,
): boolean {
  const body = willGrow ? segments : segments.slice(0, -1);
  return body.some((segment) => pointsEqual(segment, next));
}
