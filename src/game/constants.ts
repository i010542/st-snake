export const BOARD_COLUMNS = 24;
export const BOARD_ROWS = 18;
/** Default logic step: 125 ms = 8 cells/sec. */
export const STEP_MS = 125;
export const MIN_CPS = 4;
export const MAX_CPS = 15;
export const DEFAULT_CPS = 8;
export const POINTS_PER_FOOD = 10;
export const MAX_CATCH_UP_STEPS = 2;
export const HIGH_SCORE_KEY = 'st-snake.highScore.v1';
export const SPEED_CPS_KEY = 'st-snake.speedCps.v1';

export const INITIAL_SNAKE_SEGMENTS = [
  { x: 12, y: 9 },
  { x: 11, y: 9 },
  { x: 10, y: 9 },
] as const;

export const INITIAL_DIRECTION = 'right' as const;
