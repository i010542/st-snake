import { useEffect, useRef } from 'react';
import { MAX_CPS, MIN_CPS } from '../game/constants';
import { stepMsToCps } from '../game/speed';
import type { GameCommand, GameState } from '../game/types';
import { CanvasBoard } from '../render/CanvasBoard';
import { SettingsDialog } from '../settings/SettingsDialog';
import type { AppSettings } from '../settings/settings';

interface GameScreenProps {
  state: GameState;
  dispatch: (command: GameCommand) => void;
  settings: AppSettings;
  settingsOpen: boolean;
  helpOpen: boolean;
  scorePulse: boolean;
  onOpenSettings: () => void;
  onCloseSettings: () => void;
  onChangeSettings: (patch: Partial<AppSettings>) => void;
  onRestoreDefaults: () => void;
  onCloseHelp: () => void;
  onConfirmSound: () => void;
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

function phaseText(state: GameState): string {
  if (state.phase === 'menu') {
    return '菜单';
  }
  if (state.phase === 'running') {
    return '进行中';
  }
  if (state.phase === 'paused') {
    return '已暂停';
  }
  return state.endReason === 'boardFilled' ? '胜利' : '游戏结束';
}

export function GameScreen({
  state,
  dispatch,
  settings,
  settingsOpen,
  helpOpen,
  scorePulse,
  onOpenSettings,
  onCloseSettings,
  onChangeSettings,
  onRestoreDefaults,
  onCloseHelp,
  onConfirmSound,
}: GameScreenProps) {
  const continueRef = useRef<HTMLButtonElement | null>(null);
  const restartRef = useRef<HTMLButtonElement | null>(null);
  const startRef = useRef<HTMLButtonElement | null>(null);
  const speedCps = stepMsToCps(state.board.stepMs);
  const stepMsLabel = Math.round(state.board.stepMs);

  useEffect(() => {
    if (settingsOpen || helpOpen) {
      return;
    }
    if (state.phase === 'menu') {
      startRef.current?.focus();
    } else if (state.phase === 'paused') {
      continueRef.current?.focus();
    } else if (state.phase === 'gameOver') {
      restartRef.current?.focus();
    }
  }, [state.phase, settingsOpen, helpOpen]);

  const playAnd = (action: () => void) => {
    onConfirmSound();
    action();
  };

  return (
    <section className="game-screen">
      <header className="hud">
        <h1 className="title">st贪吃蛇</h1>
        <p className="phase-status" data-testid="phase-status">
          状态：{phaseText(state)}
        </p>
        <button type="button" onClick={() => playAnd(onOpenSettings)}>
          设置
        </button>
      </header>

      <div className="desktop-shell">
        <div className="board-stack">
          <CanvasBoard
            state={state}
            gridVisible={settings.gridVisible}
            dimmed={state.phase === 'paused'}
          />

          {state.phase === 'menu' ? (
            <div className="overlay">
              <div className="panel">
                <h2>经典贪吃蛇</h2>
                <p>打开即可游玩。吃到食物后蛇会变长，并得到 10 分。</p>
                <button
                  ref={startRef}
                  type="button"
                  onClick={() => playAnd(() => dispatch({ type: 'START' }))}
                >
                  开始游戏
                </button>
              </div>
            </div>
          ) : null}

          {state.phase === 'paused' && !settingsOpen ? (
            <div className="overlay">
              <div className="panel">
                <h2>暂停</h2>
                <p>已暂停。P / Esc 可继续。</p>
                <p>棋盘已冻结。继续后会重新计满一个 {stepMsLabel} 毫秒逻辑步。</p>
                <div className="actions">
                  <button
                    ref={continueRef}
                    type="button"
                    onClick={() => playAnd(() => dispatch({ type: 'RESUME' }))}
                  >
                    继续
                  </button>
                  <button
                    type="button"
                    onClick={() => playAnd(() => dispatch({ type: 'RESTART' }))}
                  >
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
                  onClick={() => playAnd(() => dispatch({ type: 'RESTART' }))}
                >
                  重新开始
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="sidebar">
          <div className="scores" aria-live="polite">
            <p className="score">
              本局分数{' '}
              <span data-testid="score" className={scorePulse ? 'score-pulse' : undefined}>
                {state.score}
              </span>
            </p>
            <p className="score">
              最高分 <span data-testid="high-score">{state.highScore}</span>
            </p>
            <p className="score" data-testid="speed-sidebar">
              速度 {speedCps} 格/秒
            </p>
          </div>

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
                  onChangeSettings({ speedCps: Number(event.target.value) });
                }}
              />
              <span>快</span>
            </div>
          </div>
        </aside>
      </div>

      <footer className="controls">
        {state.phase === 'running' ? (
          <button type="button" onClick={() => playAnd(() => dispatch({ type: 'PAUSE' }))}>
            暂停
          </button>
        ) : null}
        <p className="help-inline">
          方向键或 WASD 移动，P 或 Esc 暂停，Enter / Space 开始或重开。
        </p>
      </footer>

      {settingsOpen ? (
        <SettingsDialog
          settings={settings}
          onChange={onChangeSettings}
          onRestoreDefaults={onRestoreDefaults}
          onClose={onCloseSettings}
        />
      ) : null}

      {helpOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            data-testid="help-dialog"
          >
            <h2 id="help-title">操作说明</h2>
            <ul className="help">
              <li>方向键或 WASD：转向</li>
              <li>P 或 Esc：暂停 / 继续</li>
              <li>Enter 或空格：开始 / 重开</li>
              <li>设置打开时，Esc 先关闭设置</li>
            </ul>
            <button type="button" onClick={onCloseHelp}>
              关闭
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
