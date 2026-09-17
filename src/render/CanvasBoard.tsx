import { useEffect, useLayoutEffect, useRef } from 'react';
import type { GameState } from '../game/types';
import { drawBoard, resizeCanvas, type RenderMetrics } from './drawBoard';

interface CanvasBoardProps {
  state: GameState;
}

function readMetrics(element: HTMLElement): RenderMetrics {
  const rect = element.getBoundingClientRect();
  return {
    cssWidth: Math.max(1, rect.width),
    cssHeight: Math.max(1, rect.height),
    devicePixelRatio: window.devicePixelRatio || 1,
  };
}

export function CanvasBoard({ state }: CanvasBoardProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef(state);

  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const paint = () => {
      const metrics = readMetrics(wrap);
      resizeCanvas(canvas, metrics);
      drawBoard(context, stateRef.current, metrics);
    };

    paint();

    const observer = new ResizeObserver(() => {
      paint();
    });
    observer.observe(wrap);

    const onDprChange = () => {
      paint();
    };
    window.addEventListener('resize', onDprChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onDprChange);
    };
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!wrap || !canvas || !context) {
      return;
    }
    drawBoard(context, state, readMetrics(wrap));
  }, [state]);

  const foodLabel = state.food
    ? `食物在第 ${state.food.x + 1} 列第 ${state.food.y + 1} 行`
    : '当前没有食物';

  return (
    <div ref={wrapRef} className="board-wrap">
      <canvas
        ref={canvasRef}
        className="board-canvas"
        role="img"
        aria-label={`贪吃蛇棋盘，24 列 18 行。蛇长 ${state.snake.segments.length} 格，${foodLabel}`}
      />
    </div>
  );
}
