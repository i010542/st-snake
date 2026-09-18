import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CPS, SPEED_CPS_KEY } from '../../src/game/constants';
import {
  readSpeedCps,
  sanitizeSpeedCps,
  writeSpeedCps,
} from '../../src/storage/speed';

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

describe('sanitizeSpeedCps', () => {
  it('defaults missing or dirty values to 8 and clamps out-of-range integers', () => {
    expect(sanitizeSpeedCps(null)).toBe(DEFAULT_CPS);
    expect(sanitizeSpeedCps('')).toBe(DEFAULT_CPS);
    expect(sanitizeSpeedCps('abc')).toBe(DEFAULT_CPS);
    expect(sanitizeSpeedCps('1.5')).toBe(DEFAULT_CPS);
    expect(sanitizeSpeedCps('NaN')).toBe(DEFAULT_CPS);
    expect(sanitizeSpeedCps('-10')).toBe(4);
    expect(sanitizeSpeedCps('8')).toBe(8);
    expect(sanitizeSpeedCps('4')).toBe(4);
    expect(sanitizeSpeedCps('15')).toBe(15);
    expect(sanitizeSpeedCps('1')).toBe(4);
    expect(sanitizeSpeedCps('20')).toBe(15);
  });
});

describe('readSpeedCps / writeSpeedCps', () => {
  it('reads and writes through st-snake.speedCps.v1', () => {
    const storage = memoryStorage({ [SPEED_CPS_KEY]: '12' });
    expect(readSpeedCps(storage)).toBe(12);
    writeSpeedCps(4, storage);
    expect(storage.getItem(SPEED_CPS_KEY)).toBe('4');
  });

  it('returns 8 and does not throw when storage access fails', () => {
    const storage: Storage = {
      ...memoryStorage(),
      getItem: () => {
        throw new Error('blocked get');
      },
      setItem: () => {
        throw new Error('blocked set');
      },
    };

    expect(readSpeedCps(storage)).toBe(DEFAULT_CPS);
    expect(() => writeSpeedCps(15, storage)).not.toThrow();
  });

  it('returns 8 when window.localStorage itself throws', () => {
    const spy = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    expect(readSpeedCps()).toBe(DEFAULT_CPS);
    expect(() => writeSpeedCps(10)).not.toThrow();
    spy.mockRestore();
  });
});
