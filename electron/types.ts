export const DESKTOP_COMMANDS = ['new-game', 'toggle-pause', 'show-help'] as const;

export type DesktopCommand = (typeof DESKTOP_COMMANDS)[number];

export const DESKTOP_COMMAND_CHANNEL = 'desktop:command';

export interface DesktopBridge {
  platform: 'win32' | 'darwin' | 'linux';
  onCommand(listener: (command: DesktopCommand) => void): () => void;
}

export function isDesktopCommand(value: unknown): value is DesktopCommand {
  return (
    typeof value === 'string' &&
    (DESKTOP_COMMANDS as readonly string[]).includes(value)
  );
}
