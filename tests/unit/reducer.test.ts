import { describe, expect, it } from 'vitest';
import { BOARD_COLUMNS, BOARD_ROWS } from '../../src/game/constants';
import { reduceGame, stepGame } from '../../src/game/reducer';
import { createMenuState, createNewGame } from '../../src/game/state';
import type { Direction, GameCommand, GameState, Point } from '../../src/game/types';

const randomZero = () => 0;

function runningState(overrides: Partial<GameState> = {}): GameState {
  const base = createNewGame(0, randomZero);
  return {
    ...base,
    ...overrides,
    snake: overrides.snake ?? base.snake,
    board: overrides.board ?? base.board,
  };
}

describe('reduceGame state machine', () => {
  const transitions: Array<{
    name: string;
    from: GameState['phase'];
    command: GameCommand;
    allowed: boolean;
    nextPhase?: GameState['phase'];
  }> = [
    { name: 'START from menu', from: 'menu', command: { type: 'START' }, allowed: true, nextPhase: 'running' },
    { name: 'START from running', from: 'running', command: { type: 'START' }, allowed: false },
    { name: 'START from paused', from: 'paused', command: { type: 'START' }, allowed: false },
    { name: 'START from gameOver', from: 'gameOver', command: { type: 'START' }, allowed: false },
    { name: 'PAUSE from running', from: 'running', command: { type: 'PAUSE' }, allowed: true, nextPhase: 'paused' },
    { name: 'PAUSE from menu', from: 'menu', command: { type: 'PAUSE' }, allowed: false },
    { name: 'PAUSE from paused', from: 'paused', command: { type: 'PAUSE' }, allowed: false },
    { name: 'PAUSE from gameOver', from: 'gameOver', command: { type: 'PAUSE' }, allowed: false },
    { name: 'RESUME from paused', from: 'paused', command: { type: 'RESUME' }, allowed: true, nextPhase: 'running' },
    { name: 'RESUME from running', from: 'running', command: { type: 'RESUME' }, allowed: false },
    { name: 'RESUME from menu', from: 'menu', command: { type: 'RESUME' }, allowed: false },
    { name: 'RESUME from gameOver', from: 'gameOver', command: { type: 'RESUME' }, allowed: false },
    { name: 'RESTART from paused', from: 'paused', command: { type: 'RESTART' }, allowed: true, nextPhase: 'running' },
    { name: 'RESTART from gameOver', from: 'gameOver', command: { type: 'RESTART' }, allowed: true, nextPhase: 'running' },
    { name: 'RESTART from menu', from: 'menu', command: { type: 'RESTART' }, allowed: false },
    { name: 'RESTART from running', from: 'running', command: { type: 'RESTART' }, allowed: false },
    { name: 'TICK from running', from: 'running', command: { type: 'TICK' }, allowed: true, nextPhase: 'running' },
    { name: 'TICK from menu', from: 'menu', command: { type: 'TICK' }, allowed: false },
    { name: 'TICK from paused', from: 'paused', command: { type: 'TICK' }, allowed: false },
    { name: 'TICK from gameOver', from: 'gameOver', command: { type: 'TICK' }, allowed: false },
    {
      name: 'QUEUE_DIRECTION from running',
      from: 'running',
      command: { type: 'QUEUE_DIRECTION', direction: 'up' },
      allowed: true,
      nextPhase: 'running',
    },
    {
      name: 'QUEUE_DIRECTION from menu',
      from: 'menu',
      command: { type: 'QUEUE_DIRECTION', direction: 'up' },
      allowed: false,
    },
    {
      name: 'QUEUE_DIRECTION from paused',
      from: 'paused',
      command: { type: 'QUEUE_DIRECTION', direction: 'up' },
      allowed: false,
    },
    {
      name: 'QUEUE_DIRECTION from gameOver',
      from: 'gameOver',
      command: { type: 'QUEUE_DIRECTION', direction: 'up' },
      allowed: false,
    },
    {
      name: 'VISIBILITY_HIDDEN from running',
      from: 'running',
      command: { type: 'VISIBILITY_HIDDEN' },
      allowed: true,
      nextPhase: 'paused',
    },
    {
      name: 'VISIBILITY_HIDDEN from paused',
      from: 'paused',
      command: { type: 'VISIBILITY_HIDDEN' },
      allowed: false,
    },
  ];

  function stateFor(phase: GameState['phase']): GameState {
    if (phase === 'menu') {
      return createMenuState(0);
    }
    if (phase === 'running') {
      return runningState();
    }
    if (phase === 'paused') {
      return { ...runningState(), phase: 'paused' };
    }
    return { ...runningState(), phase: 'gameOver', endReason: 'wall' };
  }

  it.each(transitions)('$name', ({ from, command, allowed, nextPhase }) => {
    const current = stateFor(from);
    const snapshot = structuredClone(current);
    const next = reduceGame(current, command, randomZero);

    if (!allowed) {
      expect(next).toEqual(snapshot);
      return;
    }

    expect(next.phase).toBe(nextPhase);
    if (command.type === 'QUEUE_DIRECTION') {
      expect(next.snake.pendingDirection).toBe('up');
    }
  });
});

describe('input buffering through the reducer', () => {
  it('keeps only the first legal turn when right then up then left arrive before a tick', () => {
    let state = runningState({
      food: { x: 0, y: 0 },
    });

    state = reduceGame(state, { type: 'QUEUE_DIRECTION', direction: 'up' }, randomZero);
    state = reduceGame(state, { type: 'QUEUE_DIRECTION', direction: 'left' }, randomZero);
    expect(state.snake.pendingDirection).toBe('up');

    state = reduceGame(state, { type: 'TICK' }, randomZero);
    expect(state.snake.direction).toBe('up');
    expect(state.snake.segments[0]).toEqual({ x: 12, y: 8 });
    expect(state.snake.pendingDirection).toBeNull();
  });
});

describe('stepGame rules', () => {
  it('grows by one, scores +10, and replaces food when the head reaches food', () => {
    const state = runningState({
      food: { x: 13, y: 9 },
    });
    const next = stepGame(state, () => 0.9);

    expect(next.snake.segments).toHaveLength(4);
    expect(next.score).toBe(10);
    expect(next.highScore).toBe(10);
    expect(next.food).not.toBeNull();
    expect(next.food).not.toEqual({ x: 13, y: 9 });
    expect(
      next.snake.segments.some(
        (segment) => next.food !== null && segment.x === next.food.x && segment.y === next.food.y,
      ),
    ).toBe(false);
  });

  it('ends on each wall without committing an illegal head', () => {
    const walls: Array<{ direction: Direction; head: Point; reason: 'wall' }> = [
      { direction: 'left', head: { x: 0, y: 5 }, reason: 'wall' },
      { direction: 'right', head: { x: 23, y: 5 }, reason: 'wall' },
      { direction: 'up', head: { x: 5, y: 0 }, reason: 'wall' },
      { direction: 'down', head: { x: 5, y: 17 }, reason: 'wall' },
    ];

    for (const wall of walls) {
      const segments = [
        wall.head,
        { x: wall.head.x + (wall.direction === 'left' ? 1 : wall.direction === 'right' ? -1 : 0), y: wall.head.y + (wall.direction === 'up' ? 1 : wall.direction === 'down' ? -1 : 0) },
        { x: wall.head.x + (wall.direction === 'left' ? 2 : wall.direction === 'right' ? -2 : 0), y: wall.head.y + (wall.direction === 'up' ? 2 : wall.direction === 'down' ? -2 : 0) },
      ];
      const before = runningState({
        food: { x: 8, y: 8 },
        snake: {
          segments,
          direction: wall.direction,
          pendingDirection: null,
        },
      });
      const next = stepGame(before, randomZero);
      expect(next.phase).toBe('gameOver');
      expect(next.endReason).toBe('wall');
      expect(next.snake.segments).toEqual(segments);
      expect(next.score).toBe(0);
    }
  });

  it('ends on a body collision without moving', () => {
    const segments = [
      { x: 8, y: 8 },
      { x: 8, y: 7 },
      { x: 7, y: 7 },
      { x: 7, y: 8 },
      { x: 7, y: 9 },
    ];
    const before = runningState({
      food: { x: 0, y: 0 },
      snake: {
        segments,
        direction: 'left',
        pendingDirection: null,
      },
    });
    const next = stepGame(before, randomZero);
    expect(next.phase).toBe('gameOver');
    expect(next.endReason).toBe('self');
    expect(next.snake.segments).toEqual(segments);
  });

  it('allows a normal move into the vacated tail', () => {
    const segments = [
      { x: 6, y: 6 },
      { x: 5, y: 6 },
      { x: 5, y: 5 },
      { x: 6, y: 5 },
    ];
    const before = runningState({
      food: { x: 0, y: 0 },
      snake: {
        segments,
        direction: 'up',
        pendingDirection: null,
      },
    });
    const next = stepGame(before, randomZero);
    expect(next.phase).toBe('running');
    expect(next.snake.segments[0]).toEqual({ x: 6, y: 5 });
    expect(next.snake.segments).toHaveLength(4);
  });

  it('enters a board-filled win when no empty cell remains after growth', () => {
    const cells: Point[] = [];
    for (let y = 0; y < BOARD_ROWS; y += 1) {
      for (let x = 0; x < BOARD_COLUMNS; x += 1) {
        cells.push({ x, y });
      }
    }
    const food = cells[cells.length - 1];
    const body = cells.slice(0, -1);
    const head = { x: food.x - 1, y: food.y };
    const headIndex = body.findIndex((point) => point.x === head.x && point.y === head.y);
    const ordered = [body[headIndex], ...body.filter((_, index) => index !== headIndex)];

    const before = runningState({
      food,
      snake: {
        segments: ordered,
        direction: 'right',
        pendingDirection: null,
      },
    });
    const next = stepGame(before, randomZero);
    expect(next.phase).toBe('gameOver');
    expect(next.endReason).toBe('boardFilled');
    expect(next.food).toBeNull();
    expect(next.snake.segments).toHaveLength(BOARD_COLUMNS * BOARD_ROWS);
    expect(next.score).toBe(10);
  });
});
