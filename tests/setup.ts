import '@testing-library/jest-dom/vitest';

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverStub;
}

const mockContext = {
  setTransform: () => undefined,
  fillRect: () => undefined,
  beginPath: () => undefined,
  moveTo: () => undefined,
  lineTo: () => undefined,
  stroke: () => undefined,
  closePath: () => undefined,
  fill: () => undefined,
  arc: () => undefined,
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  lineCap: 'butt',
} as unknown as CanvasRenderingContext2D;

HTMLCanvasElement.prototype.getContext = ((contextId: string) => {
  if (contextId !== '2d') {
    return null;
  }
  return mockContext;
}) as HTMLCanvasElement['getContext'];
