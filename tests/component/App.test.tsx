import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../../src/app/App';
import { SPEED_CPS_KEY } from '../../src/game/constants';
import { createMenuState, createNewGame } from '../../src/game/state';
import type { GameState } from '../../src/game/types';

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = { ...initial };
  return {
    get length() {
      return Object.keys(data).length;
    },
    clear() {
      for (const key of Object.keys(data)) {
        delete data[key];
      }
    },
    getItem(key: string) {
      return key in data ? data[key] : null;
    },
    key(index: number) {
      return Object.keys(data)[index] ?? null;
    },
    removeItem(key: string) {
      delete data[key];
    },
    setItem(key: string, value: string) {
      data[key] = value;
    },
  };
}

function endedState(reason: NonNullable<GameState['endReason']>): GameState {
  return {
    ...createNewGame(20, () => 0),
    phase: 'gameOver',
    endReason: reason,
    score: 20,
    highScore: 20,
  };
}

describe('App UI', () => {
  it('shows the real game name, help and scores on the menu', () => {
    render(<App storage={memoryStorage()} random={() => 0} />);

    expect(screen.getByRole('heading', { name: 'st贪吃蛇' })).toBeInTheDocument();
    expect(screen.getByText(/方向键或 WASD/)).toBeInTheDocument();
    expect(screen.getByTestId('score')).toHaveTextContent('0');
    expect(screen.getByTestId('high-score')).toHaveTextContent('0');
    expect(screen.getByRole('button', { name: '开始游戏' })).toBeInTheDocument();
  });

  it('starts from the button and can pause, resume and restart', async () => {
    const user = userEvent.setup();
    render(<App storage={memoryStorage()} random={() => 0} />);

    await user.click(screen.getByRole('button', { name: '开始游戏' }));
    expect(screen.getByRole('button', { name: '暂停' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '暂停' }));
    expect(screen.getByRole('heading', { name: '暂停' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '继续' }));
    expect(screen.getByRole('button', { name: '暂停' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '暂停' }));
    await user.click(screen.getByRole('button', { name: '重新开始' }));
    expect(screen.getByRole('button', { name: '暂停' })).toBeInTheDocument();
    expect(screen.getByTestId('score')).toHaveTextContent('0');
  });

  it('starts, pauses, resumes and restarts from the keyboard', async () => {
    const user = userEvent.setup();
    render(<App storage={memoryStorage()} random={() => 0} initialState={createMenuState(0)} />);

    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: '暂停' })).toBeInTheDocument();

    await user.keyboard('p');
    expect(screen.getByRole('heading', { name: '暂停' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: '暂停' })).toBeInTheDocument();
  });

  it('shows the end reason and restarts from the game-over overlay', async () => {
    const user = userEvent.setup();
    render(
      <App
        storage={memoryStorage()}
        random={() => 0}
        initialState={endedState('wall')}
      />,
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('游戏结束');
    expect(alert).toHaveTextContent('撞墙');
    expect(alert).toHaveTextContent('本局分数 20');

    await user.click(screen.getByRole('button', { name: '重新开始' }));
    expect(screen.getByRole('button', { name: '暂停' })).toBeInTheDocument();
    expect(screen.getByTestId('score')).toHaveTextContent('0');
  });

  it('restarts from the game-over overlay with Space', async () => {
    const user = userEvent.setup();
    render(
      <App
        storage={memoryStorage()}
        random={() => 0}
        initialState={endedState('self')}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('撞到自己');
    await user.keyboard(' ');
    expect(screen.getByRole('button', { name: '暂停' })).toBeInTheDocument();
  });

  it('shows the speed slider on the menu with the default 8 cells/sec', () => {
    render(<App storage={memoryStorage()} random={() => 0} />);

    const slider = screen.getByTestId('speed-slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveValue('8');
    expect(screen.getByTestId('speed-readout')).toHaveTextContent('当前 8 格/秒（125 毫秒/步）');
    expect(screen.getByText('慢')).toBeInTheDocument();
    expect(screen.getByText('快')).toBeInTheDocument();
  });

  it('keeps the slider visible while running, paused and after game over', async () => {
    const user = userEvent.setup();
    const view = render(<App storage={memoryStorage()} random={() => 0} />);

    await user.click(screen.getByRole('button', { name: '开始游戏' }));
    expect(screen.getByTestId('speed-slider')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '暂停' }));
    expect(screen.getByRole('heading', { name: '暂停' })).toBeInTheDocument();
    expect(screen.getByTestId('speed-slider')).toBeInTheDocument();
    view.unmount();

    render(
      <App
        storage={memoryStorage()}
        random={() => 0}
        initialState={endedState('wall')}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('游戏结束');
    expect(screen.getByTestId('speed-slider')).toBeInTheDocument();
  });

  it('changes the live readout when dragged slower or faster', () => {
    render(<App storage={memoryStorage()} random={() => 0} />);
    const slider = screen.getByTestId('speed-slider');

    fireEvent.change(slider, { target: { value: '4' } });
    expect(slider).toHaveValue('4');
    expect(screen.getByTestId('speed-readout')).toHaveTextContent('当前 4 格/秒（250 毫秒/步）');

    fireEvent.change(slider, { target: { value: '15' } });
    expect(slider).toHaveValue('15');
    expect(screen.getByTestId('speed-readout')).toHaveTextContent('当前 15 格/秒（67 毫秒/步）');
  });

  it('persists the chosen speed and restores it after remount', () => {
    const storage = memoryStorage();
    const first = render(<App storage={storage} random={() => 0} />);
    fireEvent.change(screen.getByTestId('speed-slider'), { target: { value: '4' } });
    expect(storage.getItem(SPEED_CPS_KEY)).toBe('4');
    first.unmount();

    render(<App storage={storage} random={() => 0} />);
    expect(screen.getByTestId('speed-slider')).toHaveValue('4');
    expect(screen.getByTestId('speed-readout')).toHaveTextContent('当前 4 格/秒（250 毫秒/步）');
  });

  it('sanitizes a dirty stored speed back to the default 8', () => {
    render(
      <App
        storage={memoryStorage({ [SPEED_CPS_KEY]: 'abc' })}
        random={() => 0}
      />,
    );
    expect(screen.getByTestId('speed-slider')).toHaveValue('8');
    expect(screen.getByTestId('speed-readout')).toHaveTextContent('当前 8 格/秒（125 毫秒/步）');
  });

  it('does not resume a paused game or drop the score when speed changes', () => {
    const paused = {
      ...createNewGame(0, () => 0),
      phase: 'paused' as const,
      score: 20,
      snake: {
        segments: [
          { x: 12, y: 9 },
          { x: 11, y: 9 },
          { x: 10, y: 9 },
        ],
        direction: 'right' as const,
        pendingDirection: 'up' as const,
      },
    };

    render(
      <App
        storage={memoryStorage()}
        random={() => 0}
        initialState={paused}
      />,
    );

    fireEvent.change(screen.getByTestId('speed-slider'), { target: { value: '15' } });
    expect(screen.getByRole('heading', { name: '暂停' })).toBeInTheDocument();
    expect(screen.getByTestId('score')).toHaveTextContent('20');
    expect(screen.getByTestId('speed-readout')).toHaveTextContent('当前 15 格/秒（67 毫秒/步）');
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      expect.stringContaining('方向向右'),
    );
  });

  it('can change speed while running without leaving the run or losing score', () => {
    const running: GameState = {
      ...createNewGame(0, () => 0),
      score: 20,
      snake: {
        segments: [
          { x: 12, y: 9 },
          { x: 11, y: 9 },
          { x: 10, y: 9 },
        ],
        direction: 'right',
        pendingDirection: 'up',
      },
    };

    render(
      <App
        storage={memoryStorage()}
        random={() => 0}
        initialState={running}
      />,
    );

    fireEvent.change(screen.getByTestId('speed-slider'), { target: { value: '4' } });
    expect(screen.getByRole('button', { name: '暂停' })).toBeInTheDocument();
    expect(screen.getByTestId('score')).toHaveTextContent('20');
    expect(screen.getByTestId('speed-readout')).toHaveTextContent('当前 4 格/秒（250 毫秒/步）');
  });

  it('keeps playing when storage reads and writes throw', async () => {
    const user = userEvent.setup();
    const storage: Storage = {
      ...memoryStorage(),
      getItem: () => {
        throw new Error('read blocked');
      },
      setItem: () => {
        throw new Error('write blocked');
      },
    };

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<App storage={storage} random={() => 0} />);
    await user.click(screen.getByRole('button', { name: '开始游戏' }));
    expect(screen.getByRole('button', { name: '暂停' })).toBeInTheDocument();
    errorSpy.mockRestore();
  });
});
