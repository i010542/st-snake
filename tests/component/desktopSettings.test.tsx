import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/app/App';
import { HIGH_SCORE_KEY, SPEED_CPS_KEY } from '../../src/game/constants';
import { SOUND_ENABLED_KEY, VOLUME_KEY } from '../../src/settings/settings';
import { createNewGame } from '../../src/game/state';

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

describe('desktop settings and pause semantics', () => {
  it('pauses when settings open during a run and does not auto-resume on close', async () => {
    const user = userEvent.setup();
    render(
      <App
        storage={memoryStorage()}
        random={() => 0}
        initialState={createNewGame(0, () => 0)}
      />,
    );

    expect(screen.getByRole('button', { name: '暂停' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '设置' }));
    expect(screen.getByTestId('settings-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('phase-status')).toHaveTextContent('已暂停');
    expect(screen.queryByRole('button', { name: '暂停' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '关闭' }));
    expect(screen.queryByTestId('settings-dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '暂停' })).toBeInTheDocument();
    expect(screen.getByTestId('phase-status')).toHaveTextContent('已暂停');
  });

  it('lets Escape close settings before it can resume the game', async () => {
    const user = userEvent.setup();
    render(
      <App
        storage={memoryStorage()}
        random={() => 0}
        initialState={createNewGame(0, () => 0)}
      />,
    );

    await user.click(screen.getByRole('button', { name: '设置' }));
    expect(screen.getByTestId('settings-dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByTestId('settings-dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '暂停' })).toBeInTheDocument();
  });

  it('restores default settings without clearing the high score', async () => {
    const user = userEvent.setup();
    const storage = memoryStorage({
      [HIGH_SCORE_KEY]: '480',
      [SPEED_CPS_KEY]: '15',
      [SOUND_ENABLED_KEY]: '0',
      [VOLUME_KEY]: '10',
    });

    render(<App storage={storage} random={() => 0} />);
    expect(screen.getByTestId('high-score')).toHaveTextContent('480');
    expect(screen.getByTestId('speed-slider')).toHaveValue('15');

    await user.click(screen.getByRole('button', { name: '设置' }));
    await user.click(screen.getByTestId('restore-defaults'));

    expect(screen.getByTestId('high-score')).toHaveTextContent('480');
    expect(screen.getByTestId('settings-speed')).toHaveValue('8');
    expect(screen.getByTestId('settings-volume')).toHaveValue('70');
    expect(screen.getByTestId('settings-sound')).toBeChecked();
    expect(storage.getItem(HIGH_SCORE_KEY)).toBe('480');
    expect(storage.getItem(SPEED_CPS_KEY)).toBe('8');
  });

  it('pauses on window blur and does not toggle back on a second blur', () => {
    render(
      <App
        storage={memoryStorage()}
        random={() => 0}
        initialState={createNewGame(0, () => 0)}
      />,
    );

    expect(screen.getByRole('button', { name: '暂停' })).toBeInTheDocument();
    fireEvent.blur(window);
    expect(screen.getByRole('heading', { name: '暂停' })).toBeInTheDocument();
    fireEvent.blur(window);
    expect(screen.getByRole('heading', { name: '暂停' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '暂停' })).not.toBeInTheDocument();
  });
});
