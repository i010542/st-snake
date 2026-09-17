import {
  BOARD_COLUMNS,
  BOARD_ROWS,
  INITIAL_DIRECTION,
  INITIAL_SNAKE_SEGMENTS,
  POINTS_PER_FOOD,
  STEP_MS,
} from './constants';
import { spawnFood } from './food';
import type { BoardConfig, GameState, RandomSource, Snake } from './types';
import { clonePoint } from './types';

export function createBoardConfig(): BoardConfig {
  return {
    columns: BOARD_COLUMNS,
    rows: BOARD_ROWS,
    stepMs: STEP_MS,
    pointsPerFood: POINTS_PER_FOOD,
  };
}

export function createInitialSnake(): Snake {
  return {
    segments: INITIAL_SNAKE_SEGMENTS.map(clonePoint),
    direction: INITIAL_DIRECTION,
    pendingDirection: null,
  };
}

export function createMenuState(highScore: number): GameState {
  return {
    phase: 'menu',
    board: createBoardConfig(),
    snake: createInitialSnake(),
    food: null,
    score: 0,
    highScore,
    endReason: null,
  };
}

export function createInitialState(highScore: number): GameState {
  return createMenuState(highScore);
}

export function createNewGame(
  highScore: number,
  random: RandomSource,
): GameState {
  const board = createBoardConfig();
  const snake = createInitialSnake();

  return {
    phase: 'running',
    board,
    snake,
    food: spawnFood(board, snake.segments, random),
    score: 0,
    highScore,
    endReason: null,
  };
}
