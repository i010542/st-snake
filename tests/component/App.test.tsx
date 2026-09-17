import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../../src/app/App';
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
