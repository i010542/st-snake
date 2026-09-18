import { describe, expect, it } from 'vitest';
import { BOARD_COLUMNS, BOARD_ROWS } from '../../src/game/constants';
import { listEmptyCells, spawnFood } from '../../src/game/food';
import { createBoardConfig } from '../../src/game/state';
import { pointsEqual, type Point } from '../../src/game/types';

const board = createBoardConfig();

function fillBoard(empty: Point[]): Point[] {
  const occupied: Point[] = [];
  for (let y = 0; y < BOARD_ROWS; y += 1) {
    for (let x = 0; x < BOARD_COLUMNS; x += 1) {
      if (!empty.some((point) => pointsEqual(point, { x, y }))) {
        occupied.push({ x, y });
      }
    }
  }
  return occupied;
}

describe('listEmptyCells / spawnFood', () => {
  const snake = [
    { x: 12, y: 9 },
    { x: 11, y: 9 },
    { x: 10, y: 9 },
  ];

  it('never places food on the snake', () => {
    const food = spawnFood(board, snake, () => 0.5);
    expect(food).not.toBeNull();
    expect(snake.some((segment) => pointsEqual(segment, food!))).toBe(false);
  });

  it('maps a fixed random value to a deterministic empty cell', () => {
    const empty = listEmptyCells(board, snake);
    const food = spawnFood(board, snake, () => 0);
    expect(food).toEqual(empty[0]);

    const last = spawnFood(board, snake, () => 0.999999);
    expect(last).toEqual(empty[empty.length - 1]);
  });

  it('returns null when the board is full', () => {
    const occupied = fillBoard([]);
    expect(occupied).toHaveLength(BOARD_COLUMNS * BOARD_ROWS);
    expect(listEmptyCells(board, occupied)).toEqual([]);
    expect(spawnFood(board, occupied, () => 0)).toBeNull();
  });
});
