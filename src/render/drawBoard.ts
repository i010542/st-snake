import type { GameState } from '../game/types';
import { BOARD_COLORS } from '../styles/palette';

export interface RenderMetrics {
  cssWidth: number;
  cssHeight: number;
  devicePixelRatio: number;
}

export interface DrawOptions {
  gridVisible?: boolean;
  dimmed?: boolean;
}

export function resizeCanvas(
  canvas: HTMLCanvasElement,
  metrics: RenderMetrics,
): void {
  const dpr = metrics.devicePixelRatio > 0 ? metrics.devicePixelRatio : 1;
  canvas.style.width = `${metrics.cssWidth}px`;
  canvas.style.height = `${metrics.cssHeight}px`;
  canvas.width = Math.max(1, Math.round(metrics.cssWidth * dpr));
  canvas.height = Math.max(1, Math.round(metrics.cssHeight * dpr));
}

function cellRect(
  x: number,
  y: number,
  cellW: number,
  cellH: number,
  pad: number,
): { x: number; y: number; w: number; h: number } {
  return {
    x: x * cellW + pad,
    y: y * cellH + pad,
    w: Math.max(1, cellW - pad * 2),
    h: Math.max(1, cellH - pad * 2),
  };
}

export function drawBoard(
  context: CanvasRenderingContext2D,
  state: GameState,
  viewport: RenderMetrics,
  options: DrawOptions = {},
): void {
  const dpr = viewport.devicePixelRatio > 0 ? viewport.devicePixelRatio : 1;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);

  const { cssWidth, cssHeight } = viewport;
  const { columns, rows } = state.board;
  const cellW = cssWidth / columns;
  const cellH = cssHeight / rows;

  context.fillStyle = BOARD_COLORS.background;
  context.fillRect(0, 0, cssWidth, cssHeight);

  if (options.gridVisible !== false) {
    context.strokeStyle = BOARD_COLORS.grid;
    context.lineWidth = 1;
    context.beginPath();
    for (let x = 0; x <= columns; x += 1) {
      const px = Math.round(x * cellW) + 0.5;
      context.moveTo(px, 0);
      context.lineTo(px, cssHeight);
    }
    for (let y = 0; y <= rows; y += 1) {
      const py = Math.round(y * cellH) + 0.5;
      context.moveTo(0, py);
      context.lineTo(cssWidth, py);
    }
    context.stroke();
  }

  const pad = Math.max(1, Math.min(cellW, cellH) * 0.12);

  for (let i = 1; i < state.snake.segments.length; i += 1) {
    const segment = state.snake.segments[i];
    const rect = cellRect(segment.x, segment.y, cellW, cellH, pad);
    context.fillStyle = BOARD_COLORS.body;
    context.fillRect(rect.x, rect.y, rect.w, rect.h);
  }

  const head = state.snake.segments[0];
  if (head) {
    const rect = cellRect(head.x, head.y, cellW, cellH, pad);
    context.fillStyle = BOARD_COLORS.head;
    context.beginPath();
    context.moveTo(rect.x + rect.w / 2, rect.y);
    context.lineTo(rect.x + rect.w, rect.y + rect.h / 2);
    context.lineTo(rect.x + rect.w / 2, rect.y + rect.h);
    context.lineTo(rect.x, rect.y + rect.h / 2);
    context.closePath();
    context.fill();

    context.fillStyle = BOARD_COLORS.headMark;
    const eye = Math.max(1.5, Math.min(rect.w, rect.h) * 0.12);
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    const offset = Math.min(rect.w, rect.h) * 0.18;
    let dx = 0;
    let dy = 0;
    switch (state.snake.direction) {
      case 'up':
        dy = -offset;
        break;
      case 'down':
        dy = offset;
        break;
      case 'left':
        dx = -offset;
        break;
      case 'right':
        dx = offset;
        break;
    }
    context.beginPath();
    context.arc(cx + dx, cy + dy - eye, eye, 0, Math.PI * 2);
    context.arc(cx + dx, cy + dy + eye, eye, 0, Math.PI * 2);
    context.fill();
  }

  if (state.food) {
    const rect = cellRect(state.food.x, state.food.y, cellW, cellH, pad);
    const radius = Math.min(rect.w, rect.h) / 2;
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    context.fillStyle = BOARD_COLORS.food;
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = BOARD_COLORS.foodMark;
    context.lineWidth = Math.max(1.5, radius * 0.18);
    context.beginPath();
    context.arc(cx, cy, radius * 0.45, 0, Math.PI * 2);
    context.stroke();
  }

  if (options.dimmed) {
    context.fillStyle = 'rgba(7, 17, 29, 0.35)';
    context.fillRect(0, 0, cssWidth, cssHeight);
  }
}
