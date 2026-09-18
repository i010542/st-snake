import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createAudioManager } from '../audio/audioManager';
import { useDesktopCommands } from '../desktop/useDesktopCommands';
import { MAX_CATCH_UP_STEPS } from '../game/constants';
import { mapKeyToAction } from '../game/input';
import { advanceAccumulator } from '../game/loop';
import { reduceGame } from '../game/reducer';
import { clampCps } from '../game/speed';
import { createMenuState } from '../game/state';
import type { GameCommand, GameState, RandomSource } from '../game/types';
import {
  DEFAULT_SETTINGS,
  readAppSettings,
  restoreDefaultSettings,
  writeAppSettings,
  type AppSettings,
} from '../settings/settings';
import { readHighScore, writeHighScore } from '../storage/highScore';
import { GameScreen } from './GameScreen';

interface AppProps {
  random?: RandomSource;
  storage?: Storage;
  initialState?: GameState;
}

export function App({
  random = Math.random,
  storage,
  initialState,
}: AppProps) {
  const [settings, setSettings] = useState<AppSettings>(
    () => readAppSettings(storage),
  );
  const [state, setState] = useState<GameState>(
    () =>
      initialState ??
      createMenuState(readHighScore(storage), 1000 / settings.speedCps),
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [scorePulse, setScorePulse] = useState(false);

  const stateRef = useRef(state);
  const randomRef = useRef(random);
  const storageRef = useRef(storage);
  const settingsRef = useRef(settings);
  const settingsOpenRef = useRef(settingsOpen);
  const helpOpenRef = useRef(helpOpen);
  const audioRef = useRef(createAudioManager());
  const previousScoreRef = useRef(state.score);
  const previousPhaseRef = useRef(state.phase);

  useLayoutEffect(() => {
    stateRef.current = state;
    randomRef.current = random;
    storageRef.current = storage;
    settingsRef.current = settings;
    settingsOpenRef.current = settingsOpen;
    helpOpenRef.current = helpOpen;
  }, [state, random, storage, settings, settingsOpen, helpOpen]);

  const persistSettings = useCallback((next: AppSettings) => {
    setSettings(next);
    writeAppSettings(next, storageRef.current);
  }, []);

  const dispatch = useCallback((command: GameCommand) => {
    setState((previous) => {
      const next = reduceGame(previous, command, randomRef.current);
      if (next.highScore !== previous.highScore) {
        writeHighScore(next.highScore, storageRef.current);
      }
      return next;
    });
  }, []);

  const applyTicks = useCallback((steps: number) => {
    if (steps <= 0) {
      return;
    }
    setState((previous) => {
      let next = previous;
      for (let i = 0; i < steps; i += 1) {
        next = reduceGame(next, { type: 'TICK' }, randomRef.current);
      }
      if (next.highScore !== previous.highScore) {
        writeHighScore(next.highScore, storageRef.current);
      }
      return next;
    });
  }, []);

  const changeSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      const next: AppSettings = {
        ...settingsRef.current,
        ...patch,
        speedCps: clampCps(patch.speedCps ?? settingsRef.current.speedCps),
        volume: Math.min(100, Math.max(0, patch.volume ?? settingsRef.current.volume)),
      };
      persistSettings(next);
      if (patch.speedCps !== undefined) {
        dispatch({ type: 'SET_SPEED', cps: next.speedCps });
      }
    },
    [dispatch, persistSettings],
  );

  const openSettings = useCallback(() => {
    if (stateRef.current.phase === 'running') {
      dispatch({ type: 'PAUSE' });
    }
    setHelpOpen(false);
    setSettingsOpen(true);
  }, [dispatch]);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  const openHelp = useCallback(() => {
    if (stateRef.current.phase === 'running') {
      dispatch({ type: 'PAUSE' });
    }
    setSettingsOpen(false);
    setHelpOpen(true);
  }, [dispatch]);

  const closeHelp = useCallback(() => {
    setHelpOpen(false);
  }, []);

  const restoreDefaults = useCallback(() => {
    const next = restoreDefaultSettings(storageRef.current);
    persistSettings(next);
    dispatch({ type: 'SET_SPEED', cps: DEFAULT_SETTINGS.speedCps });
  }, [dispatch, persistSettings]);

  const playConfirm = useCallback(() => {
    audioRef.current.play('confirm', settingsRef.current);
  }, []);

  useEffect(() => {
    if (state.score > previousScoreRef.current) {
      audioRef.current.play('eat', settingsRef.current);
      setScorePulse(true);
      const timer = window.setTimeout(() => setScorePulse(false), 180);
      previousScoreRef.current = state.score;
      return () => window.clearTimeout(timer);
    }
    previousScoreRef.current = state.score;
    return undefined;
  }, [state.score]);

  useEffect(() => {
    if (state.phase === 'gameOver' && previousPhaseRef.current !== 'gameOver') {
      audioRef.current.play('die', settingsRef.current);
    }
    previousPhaseRef.current = state.phase;
  }, [state.phase]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio.dispose();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F1') {
        event.preventDefault();
        if (!event.repeat) {
          openHelp();
        }
        return;
      }

      if (event.key === 'Escape' && settingsOpenRef.current) {
        event.preventDefault();
        if (!event.repeat) {
          closeSettings();
        }
        return;
      }

      if (event.key === 'Escape' && helpOpenRef.current) {
        event.preventDefault();
        if (!event.repeat) {
          closeHelp();
        }
        return;
      }

      const action = mapKeyToAction(event.key);
      if (!action) {
        return;
      }

      const phase = stateRef.current.phase;
      const target = event.target;
      const isButton =
        target instanceof HTMLElement && target.tagName === 'BUTTON';
      const isRange =
        target instanceof HTMLInputElement && target.type === 'range';

      if (action.type === 'direction') {
        if (isRange || settingsOpenRef.current) {
          return;
        }
        if (event.key.startsWith('Arrow')) {
          event.preventDefault();
        }
        dispatch({ type: 'QUEUE_DIRECTION', direction: action.direction });
        return;
      }

      if (event.repeat) {
        return;
      }

      if (action.type === 'togglePause') {
        if (phase === 'running') {
          dispatch({ type: 'PAUSE' });
        } else if (phase === 'paused') {
          dispatch({ type: 'RESUME' });
        }
        return;
      }

      if (event.key === ' ') {
        if (isButton || settingsOpenRef.current) {
          return;
        }
        event.preventDefault();
      }

      if (phase === 'menu') {
        dispatch({ type: 'START' });
        return;
      }

      if (phase === 'gameOver') {
        dispatch({ type: 'RESTART' });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [closeHelp, closeSettings, dispatch, openHelp]);

  useEffect(() => {
    const pauseFromBackground = () => {
      dispatch({ type: 'VISIBILITY_HIDDEN' });
    };

    const onVisibility = () => {
      if (document.hidden) {
        pauseFromBackground();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', pauseFromBackground);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', pauseFromBackground);
    };
  }, [dispatch]);

  const getPhase = useCallback(() => stateRef.current.phase, []);
  useDesktopCommands(getPhase, dispatch, openHelp);

  useEffect(() => {
    let frameId = 0;
    let lastTs: number | null = null;
    let accumulatedMs = 0;
    let lastStepMs = stateRef.current.board.stepMs;
    let cancelled = false;

    const onFrame = (timestamp: number) => {
      if (cancelled) {
        return;
      }

      const stepMs = Math.max(1, stateRef.current.board.stepMs);
      if (stepMs !== lastStepMs) {
        lastStepMs = stepMs;
        lastTs = timestamp;
        accumulatedMs = 0;
      }

      if (stateRef.current.phase !== 'running') {
        lastTs = timestamp;
        accumulatedMs = 0;
      } else {
        if (lastTs === null) {
          lastTs = timestamp;
        }
        const elapsedMs = timestamp - lastTs;
        lastTs = timestamp;
        const result = advanceAccumulator(
          accumulatedMs,
          elapsedMs,
          stepMs,
          MAX_CATCH_UP_STEPS,
        );
        accumulatedMs = result.remainingMs;
        applyTicks(result.steps);
      }

      frameId = window.requestAnimationFrame(onFrame);
    };

    frameId = window.requestAnimationFrame(onFrame);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [applyTicks]);

  return (
    <GameScreen
      state={state}
      dispatch={dispatch}
      settings={settings}
      settingsOpen={settingsOpen}
      helpOpen={helpOpen}
      scorePulse={scorePulse}
      onOpenSettings={openSettings}
      onCloseSettings={closeSettings}
      onChangeSettings={changeSettings}
      onRestoreDefaults={restoreDefaults}
      onCloseHelp={closeHelp}
      onConfirmSound={playConfirm}
    />
  );
}
