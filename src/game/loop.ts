export interface AdvanceResult {
  steps: number;
  remainingMs: number;
}

export function advanceAccumulator(
  accumulatedMs: number,
  elapsedMs: number,
  stepMs: number,
  maxSteps: number,
): AdvanceResult {
  const totalMs = accumulatedMs + elapsedMs;
  const rawSteps = Math.floor(totalMs / stepMs);
  const steps = Math.min(maxSteps, Math.max(0, rawSteps));

  if (rawSteps > maxSteps) {
    return { steps: maxSteps, remainingMs: 0 };
  }

  return {
    steps,
    remainingMs: totalMs - steps * stepMs,
  };
}
