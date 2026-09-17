import { describe, expect, it, vi } from 'vitest';
import { createNewGame } from '../../src/game/state';
import { drawBoard, resizeCanvas } from '../../src/render/drawBoard';

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
