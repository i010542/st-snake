import { DEFAULT_CPS, SPEED_CPS_KEY } from '../game/constants';
import { clampCps } from '../game/speed';

function getStorage(storage?: Storage): Storage | null {
  if (storage) {
    return storage;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function sanitizeSpeedCps(raw: string | null): number {
  if (raw === null || raw === undefined || raw.trim() === '') {
    return DEFAULT_CPS;
  }

  const trimmed = raw.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    return DEFAULT_CPS;
  }

  const value = Number(trimmed);
  if (!Number.isInteger(value) || !Number.isFinite(value)) {
    return DEFAULT_CPS;
  }

  return clampCps(value);
}

export function readSpeedCps(storage?: Storage): number {
  try {
    const target = getStorage(storage);
    if (!target) {
      return DEFAULT_CPS;
    }
    return sanitizeSpeedCps(target.getItem(SPEED_CPS_KEY));
  } catch {
    return DEFAULT_CPS;
  }
}

export function writeSpeedCps(cps: number, storage?: Storage): void {
  const value = clampCps(cps);

  try {
    const target = getStorage(storage);
    if (!target) {
      return;
    }
    target.setItem(SPEED_CPS_KEY, String(value));
  } catch {
    // Storage may be unavailable; keep the in-memory session speed only.
  }
}
