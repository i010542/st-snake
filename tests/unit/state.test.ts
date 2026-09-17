import { describe, expect, it } from 'vitest';
import {
  BOARD_COLUMNS,
  BOARD_ROWS,
  INITIAL_DIRECTION,
  POINTS_PER_FOOD,
  STEP_MS,
} from '../../src/game/constants';
import { createInitialState, createMenuState, createNewGame } from '../../src/game/state';

const INITIAL_SEGMENTS = [
  { x: 12, y: 9 },
  { x: 11, y: 9 },
  { x: 10, y: 9 },
];

describe('createInitialState / createMenuState', () => {
  it('creates a menu state with the documented board, snake, score and high score', () => {
    const state = createInitialState(40);

    expect(state.phase).toBe('menu');
    expect(state.board).toEqual({
      columns: BOARD_COLUMNS,
      rows: BOARD_ROWS,
      stepMs: STEP_MS,
      pointsPerFood: POINTS_PER_FOOD,
    });
    expect(state.snake.segments).toEqual(INITIAL_SEGMENTS);
    expect(state.snake.direction).toBe(INITIAL_DIRECTION);
    expect(state.snake.pendingDirection).toBeNull();
    expect(state.food).toBeNull();
    expect(state.score).toBe(0);
    expect(state.highScore).toBe(40);
    expect(state.endReason).toBeNull();
  });

  it('keeps createMenuState equivalent to createInitialState', () => {
    expect(createMenuState(7)).toEqual(createInitialState(7));
  });
});

describe('createNewGame', () => {
  it('enters running, resets score and input lock, and places food off the snake', () => {
    const state = createNewGame(90, () => 0);

    expect(state.phase).toBe('running');
    expect(state.score).toBe(0);
    expect(state.highScore).toBe(90);
    expect(state.endReason).toBeNull();
    expect(state.snake.segments).toEqual(INITIAL_SEGMENTS);
    expect(state.snake.direction).toBe('right');
    expect(state.snake.pendingDirection).toBeNull();
    expect(state.food).toEqual({ x: 0, y: 0 });
  });
});
