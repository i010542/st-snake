import { describe, expect, it, vi } from 'vitest';
import { createNewGame } from '../../src/game/state';
import { drawBoard, resizeCanvas } from '../../src/render/drawBoard';
import { BOARD_COLORS } from '../../src/styles/palette';

function mockContext() {
  return {
    setTransform: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
  };
}

describe('drawBoard', () => {
  it('draws from a read-only snapshot and paints the food cell', () => {
    const state = createNewGame(0, () => 0);
    const context = mockContext();
    const viewport = { cssWidth: 240, cssHeight: 180, devicePixelRatio: 2 };

    drawBoard(context as unknown as CanvasRenderingContext2D, state, viewport);

    expect(context.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
    expect(context.fillRect).toHaveBeenCalled();
    expect(context.arc).toHaveBeenCalled();
    expect(state.snake.segments[0]).toEqual({ x: 12, y: 9 });
  });

  it('uses a vivid red head against gray body, light food, and a dark board', () => {
    const fills: string[] = [];
    const context = {
      ...mockContext(),
      set fillStyle(value: string) {
        fills.push(value);
      },
      get fillStyle() {
        return fills[fills.length - 1] ?? '';
      },
    };
    const state = createNewGame(0, () => 0);
    drawBoard(context as unknown as CanvasRenderingContext2D, state, {
      cssWidth: 240,
      cssHeight: 180,
      devicePixelRatio: 1,
    });

    expect(BOARD_COLORS.head).toBe('#e51400');
    expect(BOARD_COLORS.body).toBe('#b3b3b3');
    expect(BOARD_COLORS.food).toBe('#f5f5f5');
    expect(fills).toContain(BOARD_COLORS.background);
    expect(fills).toContain(BOARD_COLORS.body);
    expect(fills).toContain(BOARD_COLORS.head);
    expect(fills).toContain(BOARD_COLORS.food);
  });
});

describe('resizeCanvas', () => {
  it('scales backing store pixels by devicePixelRatio', () => {
    const canvas = {
      style: { width: '', height: '' },
      width: 0,
      height: 0,
    } as HTMLCanvasElement;

    resizeCanvas(canvas, { cssWidth: 120, cssHeight: 90, devicePixelRatio: 2 });
    expect(canvas.style.width).toBe('120px');
    expect(canvas.style.height).toBe('90px');
    expect(canvas.width).toBe(240);
    expect(canvas.height).toBe(180);
  });
});
