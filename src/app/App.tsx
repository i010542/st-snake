import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MAX_CATCH_UP_STEPS } from '../game/constants';
import { mapKeyToAction } from '../game/input';
import { advanceAccumulator } from '../game/loop';
import { reduceGame } from '../game/reducer';
import { cpsToStepMs, stepMsToCps } from '../game/speed';
import { createMenuState } from '../game/state';
import type { GameCommand, GameState, RandomSource } from '../game/types';
import { readHighScore, writeHighScore } from '../storage/highScore';
import { readSpeedCps, writeSpeedCps } from '../storage/speed';
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
  const [state, setState] = useState<GameState>(
    () =>
      initialState ??
      createMenuState(readHighScore(storage), cpsToStepMs(readSpeedCps(storage))),
  );

  const stateRef = useRef(state);
  const randomRef = useRef(random);
  const storageRef = useRef(storage);

  useLayoutEffect(() => {
    stateRef.current = state;
    randomRef.current = random;
    storageRef.current = storage;
  }, [state, random, storage]);

  const dispatch = useCallback((command: GameCommand) => {
    setState((previous) => {
      const next = reduceGame(previous, command, randomRef.current);
      if (next.highScore !== previous.highScore) {
        writeHighScore(next.highScore, storageRef.current);
      }
      if (command.type === 'SET_SPEED') {
        writeSpeedCps(stepMsToCps(next.board.stepMs), storageRef.current);
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const action = mapKeyToAction(event.key);
      if (!action) {
        return;
      }

      const phase = stateRef.current.phase;
      const target = event.target;
      const isButton =
        target instanceof HTMLElement && target.tagName === 'BUTTON';
      const isSpeedSlider =
        target instanceof HTMLInputElement && target.type === 'range';

      if (action.type === 'direction') {
        if (isSpeedSlider) {
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
        if (isButton) {
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
  }, [dispatch]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        dispatch({ type: 'VISIBILITY_HIDDEN' });
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [dispatch]);

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

  return <GameScreen state={state} dispatch={dispatch} />;
}
