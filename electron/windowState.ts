export const DEFAULT_WINDOW_WIDTH = 960;
export const DEFAULT_WINDOW_HEIGHT = 760;
export const MIN_WINDOW_WIDTH = 760;
export const MIN_WINDOW_HEIGHT = 620;
export const MIN_VISIBLE_EDGE = 40;

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SavedWindowState extends WindowBounds {
  isMaximized: boolean;
}

export interface DisplayWorkArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function parseWindowState(raw: string | null | undefined): SavedWindowState | null {
  if (raw === null || raw === undefined || raw.trim() === '') {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    if (
      !isFiniteNumber(record.x) ||
      !isFiniteNumber(record.y) ||
      !isFiniteNumber(record.width) ||
      !isFiniteNumber(record.height)
    ) {
      return null;
    }

    return {
      x: Math.round(record.x),
      y: Math.round(record.y),
      width: Math.round(record.width),
      height: Math.round(record.height),
      isMaximized: record.isMaximized === true,
    };
  } catch {
    return null;
  }
}

export function intersectionSize(a: WindowBounds, b: DisplayWorkArea): { width: number; height: number } {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);

  return {
    width: right - left,
    height: bottom - top,
  };
}

export function isBoundsVisibleOnDisplays(
  bounds: WindowBounds,
  displays: readonly DisplayWorkArea[],
  minEdge: number = MIN_VISIBLE_EDGE,
): boolean {
  if (displays.length === 0) {
    return false;
  }

  return displays.some((display) => {
    const overlap = intersectionSize(bounds, display);
    return overlap.width >= minEdge && overlap.height >= minEdge;
  });
}

export function centerOnDisplay(
  display: DisplayWorkArea,
  width: number,
  height: number,
): WindowBounds {
  return {
    x: Math.round(display.x + Math.max(0, display.width - width) / 2),
    y: Math.round(display.y + Math.max(0, display.height - height) / 2),
    width,
    height,
  };
}

export function pickPrimaryDisplay(displays: readonly DisplayWorkArea[]): DisplayWorkArea {
  if (displays.length === 0) {
    return { x: 0, y: 0, width: 1920, height: 1080 };
  }

  return (
    displays.find((display) => display.x === 0 && display.y === 0) ?? displays[0]
  );
}

export function resolveWindowState(
  saved: SavedWindowState | null,
  displays: readonly DisplayWorkArea[],
): SavedWindowState {
  const width = Math.max(
    MIN_WINDOW_WIDTH,
    saved?.width ?? DEFAULT_WINDOW_WIDTH,
  );
  const height = Math.max(
    MIN_WINDOW_HEIGHT,
    saved?.height ?? DEFAULT_WINDOW_HEIGHT,
  );

  const candidate: WindowBounds | null = saved
    ? { x: saved.x, y: saved.y, width, height }
    : null;

  if (candidate && isBoundsVisibleOnDisplays(candidate, displays)) {
    return {
      ...candidate,
      isMaximized: saved?.isMaximized === true,
    };
  }

  const centered = centerOnDisplay(pickPrimaryDisplay(displays), DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT);
  return {
    ...centered,
    isMaximized: false,
  };
}
