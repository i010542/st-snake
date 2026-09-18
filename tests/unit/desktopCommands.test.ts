import { describe, expect, it, vi } from 'vitest';
import { applyDesktopCommand } from '../../src/desktop/useDesktopCommands';
import { subscribeDesktopCommands, type DesktopCommand } from '../../src/desktop/bridge';
import type { GameCommand } from '../../src/game/types';

describe('subscribeDesktopCommands', () => {
  it('subscribes and unsubscribes through the whitelist bridge', () => {
    const unsubscribe = vi.fn();
    const listener = vi.fn();
    const onCommand = vi.fn<(listener: (command: DesktopCommand) => void) => () => void>(
      () => unsubscribe,
    );

    window.desktop = {
      platform: 'linux',
      onCommand,
    };

    const stop = subscribeDesktopCommands(listener);
    expect(onCommand).toHaveBeenCalledTimes(1);
    const registered = onCommand.mock.calls[0]?.[0];
    registered?.('toggle-pause');
    expect(listener).toHaveBeenCalledWith('toggle-pause');

    stop();
    expect(unsubscribe).toHaveBeenCalledTimes(1);

    delete window.desktop;
  });

  it('is a no-op when window.desktop is missing', () => {
    delete window.desktop;
    const stop = subscribeDesktopCommands(() => undefined);
    expect(() => stop()).not.toThrow();
  });
});

describe('applyDesktopCommand', () => {
  it('starts from the menu and restarts a running game without cloning rules', () => {
    const dispatch = vi.fn();
    applyDesktopCommand('new-game', 'menu', dispatch, vi.fn());
    expect(dispatch).toHaveBeenCalledWith({ type: 'START' });

    dispatch.mockClear();
    applyDesktopCommand('new-game', 'running', dispatch, vi.fn());
    expect(dispatch.mock.calls.map((call) => call[0] as GameCommand)).toEqual([
      { type: 'PAUSE' },
      { type: 'RESTART' },
    ]);
  });

  it('toggles pause only between running and paused', () => {
    const dispatch = vi.fn();
    applyDesktopCommand('toggle-pause', 'running', dispatch, vi.fn());
    expect(dispatch).toHaveBeenCalledWith({ type: 'PAUSE' });

    dispatch.mockClear();
    applyDesktopCommand('toggle-pause', 'paused', dispatch, vi.fn());
    expect(dispatch).toHaveBeenCalledWith({ type: 'RESUME' });

    dispatch.mockClear();
    applyDesktopCommand('toggle-pause', 'menu', dispatch, vi.fn());
    applyDesktopCommand('toggle-pause', 'gameOver', dispatch, vi.fn());
    expect(dispatch).not.toHaveBeenCalled();
  });
});
