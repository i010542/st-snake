import { HIGH_SCORE_KEY } from '../game/constants';

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

export function sanitizeHighScore(raw: string | null): number {
  if (raw === null || raw === undefined || raw.trim() === '') {
    return 0;
  }

  if (!/^\d+$/.test(raw.trim())) {
    return 0;
  }

  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0 || !Number.isFinite(value)) {
    return 0;
  }

  return value;
}

export function readHighScore(storage?: Storage): number {
  try {
    const target = getStorage(storage);
    if (!target) {
      return 0;
    }
    return sanitizeHighScore(target.getItem(HIGH_SCORE_KEY));
  } catch {
    return 0;
  }
}

export function writeHighScore(score: number, storage?: Storage): void {
  if (!Number.isInteger(score) || score < 0) {
    return;
  }

  try {
    const target = getStorage(storage);
    if (!target) {
      return;
    }
    target.setItem(HIGH_SCORE_KEY, String(score));
  } catch {
    // Storage may be unavailable; keep the in-memory session score only.
  }
}
