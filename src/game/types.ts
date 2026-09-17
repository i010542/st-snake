export type GamePhase = 'menu' | 'running' | 'paused' | 'gameOver';
export type Direction = 'up' | 'down' | 'left' | 'right';
export type EndReason = 'wall' | 'self' | 'boardFilled' | null;
export type RandomSource = () => number;

export interface Point {
  x: number;
  y: number;
}

export interface BoardConfig {
  columns: 24;
  rows: 18;
  stepMs: 125;
  pointsPerFood: 10;
}

export interface Snake {
  segments: Point[];
  direction: Direction;
  pendingDirection: Direction | null;
}

export interface GameState {
  phase: GamePhase;
  board: BoardConfig;
  snake: Snake;
  food: Point | null;
  score: number;
  highScore: number;
  endReason: EndReason;
}

export type GameCommand =
  | { type: 'START' }
  | { type: 'QUEUE_DIRECTION'; direction: Direction }
  | { type: 'TICK' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESTART' }
  | { type: 'VISIBILITY_HIDDEN' };

export type InputAction =
  | { type: 'direction'; direction: Direction }
  | { type: 'togglePause' }
  | { type: 'confirm' };

export function pointsEqual(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

export function clonePoint(point: Point): Point {
  return { x: point.x, y: point.y };
}
