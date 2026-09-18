import { useEffect } from 'react';
import type { GameCommand, GamePhase } from '../game/types';
import { subscribeDesktopCommands, type DesktopCommand } from './bridge';

export function applyDesktopCommand(
  command: DesktopCommand,
  phase: GamePhase,
  dispatch: (command: GameCommand) => void,
  onShowHelp: () => void,
): void {
  switch (command) {
    case 'new-game':
      if (phase === 'menu') {
        dispatch({ type: 'START' });
        return;
      }
      if (phase === 'running') {
        dispatch({ type: 'PAUSE' });
        dispatch({ type: 'RESTART' });
        return;
      }
      if (phase === 'paused' || phase === 'gameOver') {
        dispatch({ type: 'RESTART' });
      }
      return;
    case 'toggle-pause':
      if (phase === 'running') {
        dispatch({ type: 'PAUSE' });
      } else if (phase === 'paused') {
        dispatch({ type: 'RESUME' });
      }
      return;
    case 'show-help':
      onShowHelp();
      return;
  }
}

export function useDesktopCommands(
  getPhase: () => GamePhase,
  dispatch: (command: GameCommand) => void,
  onShowHelp: () => void,
): void {
  useEffect(() => {
    return subscribeDesktopCommands((command) => {
      applyDesktopCommand(command, getPhase(), dispatch, onShowHelp);
    });
  }, [dispatch, getPhase, onShowHelp]);
}
