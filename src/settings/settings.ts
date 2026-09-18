import { DEFAULT_CPS, SPEED_CPS_KEY } from '../game/constants';
import { clampCps } from '../game/speed';
import { readSpeedCps, sanitizeSpeedCps, writeSpeedCps } from '../storage/speed';

export const SOUND_ENABLED_KEY = 'st-snake.soundEnabled.v1';
export const VOLUME_KEY = 'st-snake.volume.v1';
export const GRID_VISIBLE_KEY = 'st-snake.gridVisible.v1';

export const DEFAULT_VOLUME = 70;

export interface AppSettings {
  speedCps: number;
  soundEnabled: boolean;
  volume: number;
  gridVisible: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  speedCps: DEFAULT_CPS,
  soundEnabled: true,
  volume: DEFAULT_VOLUME,
  gridVisible: true,
};

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

export function sanitizeBoolean(raw: string | null, fallback: boolean): boolean {
  if (raw === null || raw === undefined || raw.trim() === '') {
    return fallback;
  }

  const value = raw.trim().toLowerCase();
  if (value === '1' || value === 'true' || value === 'yes' || value === 'on') {
    return true;
  }
  if (value === '0' || value === 'false' || value === 'no' || value === 'off') {
    return false;
  }

  return fallback;
}

export function sanitizeVolume(raw: string | null): number {
  if (raw === null || raw === undefined || raw.trim() === '') {
    return DEFAULT_VOLUME;
  }

  const trimmed = raw.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    return DEFAULT_VOLUME;
  }

  const value = Number(trimmed);
  if (!Number.isInteger(value) || !Number.isFinite(value)) {
    return DEFAULT_VOLUME;
  }

  return Math.min(100, Math.max(0, value));
}

export function sanitizeSettings(partial: Partial<AppSettings> | null | undefined): AppSettings {
  return {
    speedCps: clampCps(partial?.speedCps ?? DEFAULT_CPS),
    soundEnabled: partial?.soundEnabled ?? DEFAULT_SETTINGS.soundEnabled,
    volume: sanitizeVolume(
      partial?.volume === undefined ? null : String(partial.volume),
    ),
    gridVisible: partial?.gridVisible ?? DEFAULT_SETTINGS.gridVisible,
  };
}

export function readAppSettings(storage?: Storage): AppSettings {
  try {
    const target = getStorage(storage);
    if (!target) {
      return { ...DEFAULT_SETTINGS };
    }

    return {
      speedCps: sanitizeSpeedCps(target.getItem(SPEED_CPS_KEY)),
      soundEnabled: sanitizeBoolean(
        target.getItem(SOUND_ENABLED_KEY),
        DEFAULT_SETTINGS.soundEnabled,
      ),
      volume: sanitizeVolume(target.getItem(VOLUME_KEY)),
      gridVisible: sanitizeBoolean(
        target.getItem(GRID_VISIBLE_KEY),
        DEFAULT_SETTINGS.gridVisible,
      ),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function writeAppSettings(settings: AppSettings, storage?: Storage): void {
  const next = sanitizeSettings(settings);

  try {
    writeSpeedCps(next.speedCps, storage);
    const target = getStorage(storage);
    if (!target) {
      return;
    }
    target.setItem(SOUND_ENABLED_KEY, next.soundEnabled ? '1' : '0');
    target.setItem(VOLUME_KEY, String(next.volume));
    target.setItem(GRID_VISIBLE_KEY, next.gridVisible ? '1' : '0');
  } catch {
    // Storage may be unavailable; keep in-memory settings only.
  }
}

export function restoreDefaultSettings(storage?: Storage): AppSettings {
  const next = { ...DEFAULT_SETTINGS };
  writeAppSettings(next, storage);
  return next;
}

export function readSpeedPreference(storage?: Storage): number {
  return readSpeedCps(storage);
}
