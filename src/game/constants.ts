export const BOARD_COLUMNS = 24;
export const BOARD_ROWS = 18;
export const STEP_MS = 125;
export const POINTS_PER_FOOD = 10;
export const MAX_CATCH_UP_STEPS = 2;
export const HIGH_SCORE_KEY = 'st-snake.highScore.v1';

export const INITIAL_SNAKE_SEGMENTS = [
  { x: 12, y: 9 },
  { x: 11, y: 9 },
  { x: 10, y: 9 },
] as const;

export const INITIAL_DIRECTION = 'right' as const;
