import { describe, expect, it, vi } from 'vitest';
import { HIGH_SCORE_KEY } from '../../src/game/constants';
import {
  readHighScore,
  sanitizeHighScore,
  writeHighScore,
} from '../../src/storage/highScore';

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

describe('sanitizeHighScore', () => {
  it('accepts non-negative integers and rejects dirty values', () => {
    expect(sanitizeHighScore('20')).toBe(20);
    expect(sanitizeHighScore('0')).toBe(0);
    expect(sanitizeHighScore(null)).toBe(0);
    expect(sanitizeHighScore('abc')).toBe(0);
    expect(sanitizeHighScore('-10')).toBe(0);
    expect(sanitizeHighScore('1.5')).toBe(0);
    expect(sanitizeHighScore('NaN')).toBe(0);
  });
});

describe('readHighScore / writeHighScore', () => {
  it('reads a stored integer through the fixed key', () => {
    const storage = memoryStorage({ [HIGH_SCORE_KEY]: '30' });
    expect(readHighScore(storage)).toBe(30);
  });

  it('writes an integer and ignores invalid writes', () => {
    const storage = memoryStorage();
    writeHighScore(50, storage);
    expect(storage.getItem(HIGH_SCORE_KEY)).toBe('50');
    writeHighScore(-1, storage);
    expect(storage.getItem(HIGH_SCORE_KEY)).toBe('50');
  });

  it('returns 0 and does not throw when storage access fails', () => {
    const storage: Storage = {
      ...memoryStorage(),
      getItem: () => {
        throw new Error('blocked get');
      },
      setItem: () => {
        throw new Error('blocked set');
      },
    };

    expect(readHighScore(storage)).toBe(0);
    expect(() => writeHighScore(10, storage)).not.toThrow();
  });

  it('returns 0 when window.localStorage itself throws', () => {
    const spy = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    expect(readHighScore()).toBe(0);
    expect(() => writeHighScore(12)).not.toThrow();
    spy.mockRestore();
  });
});
