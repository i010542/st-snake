import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import {
  DESKTOP_COMMAND_CHANNEL,
  isDesktopCommand,
  type DesktopCommand,
} from './types';

const platform: 'win32' | 'darwin' | 'linux' =
  process.platform === 'win32' || process.platform === 'darwin' || process.platform === 'linux'
    ? process.platform
    : 'linux';

contextBridge.exposeInMainWorld('desktop', {
  platform,
  onCommand(listener: (command: DesktopCommand) => void): () => void {
    const handler = (_event: IpcRendererEvent, command: unknown) => {
      if (isDesktopCommand(command)) {
        listener(command);
      }
    };

    ipcRenderer.on(DESKTOP_COMMAND_CHANNEL, handler);
    return () => {
      ipcRenderer.removeListener(DESKTOP_COMMAND_CHANNEL, handler);
    };
  },
});
