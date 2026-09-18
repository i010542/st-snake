import { useEffect, useLayoutEffect, useRef } from 'react';
import type { GameState } from '../game/types';
import { drawBoard, resizeCanvas, type RenderMetrics } from './drawBoard';

interface CanvasBoardProps {
  state: GameState;
  gridVisible?: boolean;
  dimmed?: boolean;
}

function readMetrics(element: HTMLElement): RenderMetrics {
  const rect = element.getBoundingClientRect();
  return {
    cssWidth: Math.max(1, rect.width),
    cssHeight: Math.max(1, rect.height),
    devicePixelRatio: window.devicePixelRatio || 1,
  };
}

function fitBoard(width: number, height: number): { cssWidth: number; cssHeight: number } {
  const cell = Math.max(1, Math.floor(Math.min(width / 24, height / 18)));
  return {
    cssWidth: cell * 24,
    cssHeight: cell * 18,
  };
}

export function CanvasBoard({
  state,
  gridVisible = true,
  dimmed = false,
}: CanvasBoardProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef(state);
  const optionsRef = useRef({ gridVisible, dimmed });

  useLayoutEffect(() => {
    stateRef.current = state;
    optionsRef.current = { gridVisible, dimmed };
  }, [state, gridVisible, dimmed]);

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
      const raw = readMetrics(wrap);
      const fitted = fitBoard(raw.cssWidth, raw.cssHeight);
      const metrics = {
        ...raw,
        cssWidth: fitted.cssWidth,
        cssHeight: fitted.cssHeight,
      };
      resizeCanvas(canvas, metrics);
      drawBoard(context, stateRef.current, metrics, optionsRef.current);
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
    const raw = readMetrics(wrap);
    const fitted = fitBoard(raw.cssWidth, raw.cssHeight);
    drawBoard(
      context,
      state,
      { ...raw, cssWidth: fitted.cssWidth, cssHeight: fitted.cssHeight },
      { gridVisible, dimmed },
    );
  }, [state, gridVisible, dimmed]);

  const foodLabel = state.food
    ? `食物在第 ${state.food.x + 1} 列第 ${state.food.y + 1} 行`
    : '当前没有食物';
  const head = state.snake.segments[0];
  const directionLabel = {
    up: '上',
    down: '下',
    left: '左',
    right: '右',
  }[state.snake.direction];
  const headLabel = head
    ? `蛇头在第 ${head.x + 1} 列第 ${head.y + 1} 行，方向向${directionLabel}`
    : '蛇尚未就位';

  return (
    <div ref={wrapRef} className="board-wrap">
      <canvas
        ref={canvasRef}
        className="board-canvas"
        role="img"
        aria-label={`贪吃蛇棋盘，24 列 18 行。蛇长 ${state.snake.segments.length} 格，${headLabel}。${foodLabel}`}
      />
    </div>
  );
}
