import { useEffect, useRef } from 'react';
import { MAX_CPS, MIN_CPS } from '../game/constants';
import { stepMsToCps } from '../game/speed';
import type { GameCommand, GameState } from '../game/types';
import { CanvasBoard } from '../render/CanvasBoard';

interface GameScreenProps {
  state: GameState;
  dispatch: (command: GameCommand) => void;
}

function endReasonText(reason: GameState['endReason']): string {
  switch (reason) {
    case 'wall':
      return '撞墙';
    case 'self':
      return '撞到自己';
    case 'boardFilled':
      return '填满棋盘';
    default:
      return '';
  }
}

export function GameScreen({ state, dispatch }: GameScreenProps) {
  const continueRef = useRef<HTMLButtonElement | null>(null);
  const restartRef = useRef<HTMLButtonElement | null>(null);
  const startRef = useRef<HTMLButtonElement | null>(null);
  const speedCps = stepMsToCps(state.board.stepMs);
  const stepMsLabel = Math.round(state.board.stepMs);

  useEffect(() => {
    if (state.phase === 'menu') {
      startRef.current?.focus();
    } else if (state.phase === 'paused') {
      continueRef.current?.focus();
    } else if (state.phase === 'gameOver') {
      restartRef.current?.focus();
    }
  }, [state.phase]);

  return (
    <section className="game-screen">
      <header className="hud">
        <h1 className="title">st贪吃蛇</h1>
        <div className="scores" aria-live="polite">
          <p className="score">
            分数 <span data-testid="score">{state.score}</span>
          </p>
          <p className="score">
            最高分 <span data-testid="high-score">{state.highScore}</span>
          </p>
        </div>
      </header>

      <div className="stage">
        <CanvasBoard state={state} />

        <div className="speed-control">
          <div className="speed-control-header">
            <label htmlFor="speed-slider">速度</label>
            <p className="speed-readout" data-testid="speed-readout">
              当前 {speedCps} 格/秒（{stepMsLabel} 毫秒/步）
            </p>
          </div>
          <div className="speed-slider-row">
            <span>慢</span>
            <input
              id="speed-slider"
              data-testid="speed-slider"
              type="range"
              min={MIN_CPS}
              max={MAX_CPS}
              step={1}
              value={speedCps}
              aria-valuemin={MIN_CPS}
              aria-valuemax={MAX_CPS}
              aria-valuenow={speedCps}
              aria-valuetext={`${speedCps} 格每秒，从慢到快`}
              onChange={(event) => {
                dispatch({
                  type: 'SET_SPEED',
                  cps: Number(event.target.value),
                });
              }}
            />
            <span>快</span>
          </div>
        </div>

        {state.phase === 'menu' ? (
          <div className="overlay">
            <div className="panel">
              <h2>经典贪吃蛇</h2>
              <p>打开即可游玩。吃到食物后蛇会变长，并得到 10 分。</p>
              <ul className="help">
                <li>方向键或 WASD：转向</li>
                <li>P 或 Esc：暂停 / 继续</li>
                <li>Enter 或空格：开始 / 重开</li>
              </ul>
              <button
                ref={startRef}
                type="button"
                onClick={() => dispatch({ type: 'START' })}
              >
                开始游戏
              </button>
            </div>
          </div>
        ) : null}

        {state.phase === 'paused' ? (
          <div className="overlay">
            <div className="panel">
              <h2>暂停</h2>
              <p>棋盘已冻结。继续后会重新计满一个 {stepMsLabel} 毫秒逻辑步。</p>
              <div className="actions">
                <button
                  ref={continueRef}
                  type="button"
                  onClick={() => dispatch({ type: 'RESUME' })}
                >
                  继续
                </button>
                <button type="button" onClick={() => dispatch({ type: 'RESTART' })}>
                  重新开始
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {state.phase === 'gameOver' ? (
          <div className="overlay">
            <div className="panel" role="alert">
              <h2>{state.endReason === 'boardFilled' ? '胜利' : '游戏结束'}</h2>
              <p>
                {state.endReason === 'boardFilled' ? '胜利' : '游戏结束'}
                {state.endReason ? `：${endReasonText(state.endReason)}` : ''}
              </p>
              <p>
                本局分数 {state.score}，最高分 {state.highScore}
              </p>
              <button
                ref={restartRef}
                type="button"
                onClick={() => dispatch({ type: 'RESTART' })}
              >
                重新开始
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <footer className="controls">
        {state.phase === 'running' ? (
          <button type="button" onClick={() => dispatch({ type: 'PAUSE' })}>
            暂停
          </button>
        ) : null}
        <p className="help-inline">
          方向键 / WASD 移动，P / Esc 暂停或继续，Enter / 空格开始或重开。
        </p>
      </footer>
    </section>
  );
}
