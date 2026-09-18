import { DEFAULT_CPS, MAX_CPS, MIN_CPS, STEP_MS } from './constants';

export function clampCps(cps: number): number {
  if (!Number.isFinite(cps)) {
    return DEFAULT_CPS;
  }

  return Math.min(MAX_CPS, Math.max(MIN_CPS, Math.round(cps)));
}

export function cpsToStepMs(cps: number): number {
  return 1000 / clampCps(cps);
}

export function stepMsToCps(stepMs: number): number {
  if (!Number.isFinite(stepMs) || stepMs <= 0) {
    return DEFAULT_CPS;
  }

  return clampCps(1000 / stepMs);
}

export function normalizeStepMs(stepMs: number = STEP_MS): number {
  return cpsToStepMs(stepMsToCps(stepMs));
}
