import type { BoardConfig, Point, RandomSource } from './types';

function occupiedKey(point: Point): string {
  return `${point.x},${point.y}`;
}

export function listEmptyCells(
  board: BoardConfig,
  segments: readonly Point[],
): Point[] {
  const occupied = new Set(segments.map(occupiedKey));
  const empty: Point[] = [];

  for (let y = 0; y < board.rows; y += 1) {
    for (let x = 0; x < board.columns; x += 1) {
      if (!occupied.has(`${x},${y}`)) {
        empty.push({ x, y });
      }
    }
  }

  return empty;
}

export function spawnFood(
  board: BoardConfig,
  segments: readonly Point[],
  random: RandomSource,
): Point | null {
  const emptyCells = listEmptyCells(board, segments);
  if (emptyCells.length === 0) {
    return null;
  }

  const index = Math.min(
    emptyCells.length - 1,
    Math.floor(random() * emptyCells.length),
  );

  return emptyCells[index];
}
