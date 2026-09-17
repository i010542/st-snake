import { POINTS_PER_FOOD } from './constants';
import { isOutside, isSelfCollision } from './collision';
import { spawnFood } from './food';
import { queueDirection } from './input';
import { moveSnake, nextHead } from './movement';
import { createNewGame } from './state';
import { pointsEqual, type GameCommand, type GameState, type RandomSource } from './types';

function withUpdatedHighScore(state: GameState, score: number): number {
  return Math.max(state.highScore, score);
}

export function stepGame(state: GameState, random: RandomSource): GameState {
  if (state.phase !== 'running') {
    return state;
  }

  const effectiveDirection = state.snake.pendingDirection ?? state.snake.direction;
  const next = nextHead(state.snake.segments[0], effectiveDirection);
  const willGrow = state.food !== null && pointsEqual(next, state.food);

  if (isOutside(next, state.board)) {
    return {
      ...state,
      phase: 'gameOver',
      endReason: 'wall',
      highScore: withUpdatedHighScore(state, state.score),
    };
  }

  if (isSelfCollision(next, state.snake.segments, willGrow)) {
    return {
      ...state,
      phase: 'gameOver',
      endReason: 'self',
      highScore: withUpdatedHighScore(state, state.score),
    };
  }

  const snake = moveSnake(state.snake, effectiveDirection, willGrow);

  if (!willGrow) {
    return {
      ...state,
      snake,
    };
  }

  const score = state.score + POINTS_PER_FOOD;
  const highScore = withUpdatedHighScore(state, score);
  const food = spawnFood(state.board, snake.segments, random);

  if (food === null) {
    return {
      ...state,
      snake,
      food: null,
      score,
      highScore,
      phase: 'gameOver',
      endReason: 'boardFilled',
    };
  }

  return {
    ...state,
    snake,
    food,
    score,
    highScore,
  };
}

export function reduceGame(
  state: GameState,
  command: GameCommand,
  random: RandomSource,
): GameState {
  switch (command.type) {
    case 'START':
      if (state.phase !== 'menu') {
        return state;
      }
      return createNewGame(state.highScore, random);
    case 'PAUSE':
      if (state.phase !== 'running') {
        return state;
      }
      return { ...state, phase: 'paused' };
    case 'RESUME':
      if (state.phase !== 'paused') {
        return state;
      }
      return { ...state, phase: 'running' };
    case 'RESTART':
      if (state.phase !== 'paused' && state.phase !== 'gameOver') {
        return state;
      }
      return createNewGame(state.highScore, random);
    case 'TICK':
      if (state.phase !== 'running') {
        return state;
      }
      return stepGame(state, random);
    case 'QUEUE_DIRECTION':
      if (state.phase !== 'running') {
        return state;
      }
      return {
        ...state,
        snake: queueDirection(state.snake, command.direction),
      };
    case 'VISIBILITY_HIDDEN':
      if (state.phase !== 'running') {
        return state;
      }
      return { ...state, phase: 'paused' };
  }
}
