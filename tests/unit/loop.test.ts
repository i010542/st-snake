import { describe, expect, it } from 'vitest';
import { MAX_CATCH_UP_STEPS, STEP_MS } from '../../src/game/constants';
import { advanceAccumulator } from '../../src/game/loop';

describe('advanceAccumulator', () => {
  it('does not step before a full interval', () => {
    expect(advanceAccumulator(0, 124, STEP_MS, MAX_CATCH_UP_STEPS)).toEqual({
      steps: 0,
      remainingMs: 124,
    });
  });

  it('takes exactly one step at 125 ms', () => {
    expect(advanceAccumulator(0, 125, STEP_MS, MAX_CATCH_UP_STEPS)).toEqual({
      steps: 1,
      remainingMs: 0,
    });
  });

  it('takes two steps at 250 ms', () => {
    expect(advanceAccumulator(0, 250, STEP_MS, MAX_CATCH_UP_STEPS)).toEqual({
      steps: 2,
      remainingMs: 0,
    });
  });

  it('caps catch-up at two steps and discards leftover time', () => {
    expect(advanceAccumulator(0, 1000, STEP_MS, MAX_CATCH_UP_STEPS)).toEqual({
      steps: 2,
      remainingMs: 0,
    });
  });

  it('uses the caller-supplied stepMs instead of a frozen default', () => {
    expect(advanceAccumulator(0, 249, 250, MAX_CATCH_UP_STEPS)).toEqual({
      steps: 0,
      remainingMs: 249,
    });
    expect(advanceAccumulator(0, 250, 250, MAX_CATCH_UP_STEPS)).toEqual({
      steps: 1,
      remainingMs: 0,
    });
    expect(advanceAccumulator(0, 1000 / 15, 1000 / 15, MAX_CATCH_UP_STEPS)).toEqual({
      steps: 1,
      remainingMs: 0,
    });
  });
});
