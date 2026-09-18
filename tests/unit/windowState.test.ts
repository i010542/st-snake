import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WINDOW_HEIGHT,
  DEFAULT_WINDOW_WIDTH,
  isBoundsVisibleOnDisplays,
  parseWindowState,
  resolveWindowState,
} from '../../electron/windowState';

const primary = { x: 0, y: 0, width: 1920, height: 1080 };
const secondary = { x: 1920, y: 0, width: 1600, height: 900 };

describe('parseWindowState', () => {
  it('rejects dirty JSON and non-numeric bounds', () => {
    expect(parseWindowState(null)).toBeNull();
    expect(parseWindowState('abc')).toBeNull();
    expect(parseWindowState('{"x":"no"}')).toBeNull();
    expect(parseWindowState('{"x":10,"y":10,"width":960,"height":760}')).toEqual({
      x: 10,
      y: 10,
      width: 960,
      height: 760,
      isMaximized: false,
    });
  });
});

describe('resolveWindowState', () => {
  it('keeps a window that still intersects an attached display', () => {
    const saved = {
      x: 2000,
      y: 80,
      width: 960,
      height: 760,
      isMaximized: true,
    };

    expect(isBoundsVisibleOnDisplays(saved, [primary, secondary])).toBe(true);
    expect(resolveWindowState(saved, [primary, secondary])).toEqual(saved);
  });

  it('centers on the primary display when the saved screen was removed', () => {
    const saved = {
      x: 2100,
      y: 80,
      width: 960,
      height: 760,
      isMaximized: true,
    };

    const resolved = resolveWindowState(saved, [primary]);
    expect(isBoundsVisibleOnDisplays(saved, [primary])).toBe(false);
    expect(resolved).toEqual({
      x: Math.round((1920 - DEFAULT_WINDOW_WIDTH) / 2),
      y: Math.round((1080 - DEFAULT_WINDOW_HEIGHT) / 2),
      width: DEFAULT_WINDOW_WIDTH,
      height: DEFAULT_WINDOW_HEIGHT,
      isMaximized: false,
    });
  });
});
