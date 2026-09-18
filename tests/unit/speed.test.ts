import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CPS,
  MAX_CPS,
  MIN_CPS,
  STEP_MS,
} from '../../src/game/constants';
import {
  clampCps,
  cpsToStepMs,
  normalizeStepMs,
  stepMsToCps,
} from '../../src/game/speed';

describe('clampCps', () => {
  it('keeps values inside 4..15 and defaults non-finite input', () => {
    expect(clampCps(8)).toBe(DEFAULT_CPS);
    expect(clampCps(4)).toBe(MIN_CPS);
    expect(clampCps(15)).toBe(MAX_CPS);
    expect(clampCps(1)).toBe(MIN_CPS);
    expect(clampCps(20)).toBe(MAX_CPS);
    expect(clampCps(4.4)).toBe(4);
    expect(clampCps(14.6)).toBe(15);
    expect(clampCps(Number.NaN)).toBe(DEFAULT_CPS);
    expect(clampCps(Number.POSITIVE_INFINITY)).toBe(DEFAULT_CPS);
  });
});

describe('cps ↔ stepMs', () => {
  it('maps the documented default and range endpoints', () => {
    expect(cpsToStepMs(DEFAULT_CPS)).toBe(STEP_MS);
    expect(cpsToStepMs(MIN_CPS)).toBe(250);
    expect(cpsToStepMs(MAX_CPS)).toBeCloseTo(1000 / 15);
    expect(stepMsToCps(STEP_MS)).toBe(DEFAULT_CPS);
    expect(stepMsToCps(250)).toBe(MIN_CPS);
    expect(stepMsToCps(1000 / 15)).toBe(MAX_CPS);
    expect(stepMsToCps(0)).toBe(DEFAULT_CPS);
    expect(normalizeStepMs()).toBe(STEP_MS);
    expect(normalizeStepMs(250)).toBe(250);
  });
});
