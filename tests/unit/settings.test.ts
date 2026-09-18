import { describe, expect, it, vi } from 'vitest';
import { HIGH_SCORE_KEY, SPEED_CPS_KEY } from '../../src/game/constants';
import {
  DEFAULT_SETTINGS,
  GRID_VISIBLE_KEY,
  SOUND_ENABLED_KEY,
  VOLUME_KEY,
  readAppSettings,
  restoreDefaultSettings,
  sanitizeBoolean,
  sanitizeVolume,
  writeAppSettings,
} from '../../src/settings/settings';
import { writeHighScore } from '../../src/storage/highScore';

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

describe('settings sanitization', () => {
  it('falls dirty booleans back to the provided default', () => {
    expect(sanitizeBoolean(null, true)).toBe(true);
    expect(sanitizeBoolean('abc', true)).toBe(true);
    expect(sanitizeBoolean('false', true)).toBe(false);
    expect(sanitizeBoolean('0', true)).toBe(false);
    expect(sanitizeBoolean('1', false)).toBe(true);
  });

  it('clamps volume and rejects dirty values', () => {
    expect(sanitizeVolume(null)).toBe(70);
    expect(sanitizeVolume('abc')).toBe(70);
    expect(sanitizeVolume('1.5')).toBe(70);
    expect(sanitizeVolume('-8')).toBe(0);
    expect(sanitizeVolume('140')).toBe(100);
    expect(sanitizeVolume('40')).toBe(40);
  });
});

describe('settings storage', () => {
  it('reads dirty stored values back to safe defaults and clamps numbers', () => {
    const storage = memoryStorage({
      [SPEED_CPS_KEY]: '99',
      [SOUND_ENABLED_KEY]: 'maybe',
      [VOLUME_KEY]: 'nope',
      [GRID_VISIBLE_KEY]: 'zzz',
    });

    expect(readAppSettings(storage)).toEqual({
      speedCps: 15,
      soundEnabled: true,
      volume: 70,
      gridVisible: true,
    });
  });

  it('does not throw when storage access fails', () => {
    const storage: Storage = {
      ...memoryStorage(),
      getItem: () => {
        throw new Error('blocked get');
      },
      setItem: () => {
        throw new Error('blocked set');
      },
    };

    expect(readAppSettings(storage)).toEqual(DEFAULT_SETTINGS);
    expect(() => writeAppSettings(DEFAULT_SETTINGS, storage)).not.toThrow();
  });

  it('restores defaults without clearing the high score', () => {
    const storage = memoryStorage({
      [SPEED_CPS_KEY]: '15',
      [SOUND_ENABLED_KEY]: '0',
      [VOLUME_KEY]: '10',
      [GRID_VISIBLE_KEY]: '0',
    });
    writeHighScore(480, storage);

    const next = restoreDefaultSettings(storage);
    expect(next).toEqual(DEFAULT_SETTINGS);
    expect(storage.getItem(SPEED_CPS_KEY)).toBe('8');
    expect(storage.getItem(SOUND_ENABLED_KEY)).toBe('1');
    expect(storage.getItem(VOLUME_KEY)).toBe('70');
    expect(storage.getItem(GRID_VISIBLE_KEY)).toBe('1');
    expect(storage.getItem(HIGH_SCORE_KEY)).toBe('480');
  });

  it('still restores defaults when writing throws', () => {
    const storage: Storage = {
      ...memoryStorage({ [HIGH_SCORE_KEY]: '20' }),
      setItem: () => {
        throw new Error('blocked set');
      },
    };
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(restoreDefaultSettings(storage)).toEqual(DEFAULT_SETTINGS);
    expect(storage.getItem(HIGH_SCORE_KEY)).toBe('20');
    errorSpy.mockRestore();
  });
});
