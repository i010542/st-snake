export type DesktopCommand = 'new-game' | 'toggle-pause' | 'show-help';

export interface DesktopBridge {
  platform: 'win32' | 'darwin' | 'linux';
  onCommand(listener: (command: DesktopCommand) => void): () => void;
}

export function getDesktopBridge(): DesktopBridge | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window.desktop;
}

export function subscribeDesktopCommands(
  listener: (command: DesktopCommand) => void,
): () => void {
  const bridge = getDesktopBridge();
  if (!bridge) {
    return () => undefined;
  }

  return bridge.onCommand(listener);
}
