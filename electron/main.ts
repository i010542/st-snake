import {
  app,
  BrowserWindow,
  Menu,
  dialog,
  screen,
  type MenuItemConstructorOptions,
} from 'electron';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DESKTOP_COMMAND_CHANNEL, type DesktopCommand } from './types';
import {
  MIN_WINDOW_HEIGHT,
  MIN_WINDOW_WIDTH,
  parseWindowState,
  resolveWindowState,
  type DisplayWorkArea,
  type SavedWindowState,
} from './windowState';

const BACKGROUND = '#0B1220';
const WINDOW_STATE_FILE = 'window-state.json';

let mainWindow: BrowserWindow | null = null;

function isPackaged(): boolean {
  return app.isPackaged;
}

function isolateUserDataForTests(): void {
  if (!process.env.ST_SNAKE_E2E) {
    return;
  }

  const root = process.env.ST_SNAKE_USER_DATA ?? path.join(os.tmpdir(), 'st-snake-e2e');
  fs.mkdirSync(root, { recursive: true });
  app.setPath('userData', root);
}

function windowStatePath(): string {
  return path.join(app.getPath('userData'), WINDOW_STATE_FILE);
}

function readSavedWindowState(): SavedWindowState | null {
  try {
    return parseWindowState(fs.readFileSync(windowStatePath(), 'utf8'));
  } catch {
    return null;
  }
}

function writeSavedWindowState(state: SavedWindowState): void {
  try {
    fs.mkdirSync(app.getPath('userData'), { recursive: true });
    fs.writeFileSync(windowStatePath(), `${JSON.stringify(state)}\n`, 'utf8');
  } catch {
    // Window state is convenience-only; never block quit.
  }
}

function currentDisplays(): DisplayWorkArea[] {
  return screen.getAllDisplays().map((display) => ({
    x: display.workArea.x,
    y: display.workArea.y,
    width: display.workArea.width,
    height: display.workArea.height,
  }));
}

function captureWindowState(win: BrowserWindow): SavedWindowState {
  const isMaximized = win.isMaximized();
  const bounds = isMaximized ? win.getNormalBounds() : win.getBounds();
  return {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    isMaximized,
  };
}

function sendCommand(command: DesktopCommand): void {
  mainWindow?.webContents.send(DESKTOP_COMMAND_CHANNEL, command);
}

function adjustZoom(delta: number): void {
  if (!mainWindow) {
    return;
  }
  const next = Math.min(2, Math.max(0.5, mainWindow.webContents.getZoomFactor() + delta));
  mainWindow.webContents.setZoomFactor(Number(next.toFixed(2)));
}

async function showAbout(): Promise<void> {
  if (!mainWindow) {
    return;
  }

  await dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: '关于 st贪吃蛇',
    message: 'st贪吃蛇',
    detail: '本地离线桌面版，无需联网。\n版本 0.1.0\n应用标识 com.i010542.st-snake',
  });
}

function buildMenu(): Menu {
  const viewExtra: MenuItemConstructorOptions[] = isPackaged()
    ? []
    : [
        { type: 'separator' },
        { label: '开发者工具', role: 'toggleDevTools' },
      ];

  const template: MenuItemConstructorOptions[] = [
    {
      label: '游戏',
      submenu: [
        {
          label: '新游戏',
          accelerator: 'CommandOrControl+N',
          click: () => sendCommand('new-game'),
        },
        {
          label: '暂停/继续',
          click: () => sendCommand('toggle-pause'),
        },
        { type: 'separator' },
        {
          label: '退出',
          role: 'quit',
          accelerator: process.platform === 'win32' ? 'Alt+F4' : 'CommandOrControl+Q',
        },
      ],
    },
    {
      label: '视图',
      submenu: [
        {
          label: '全屏',
          accelerator: 'F11',
          click: () => {
            if (!mainWindow) {
              return;
            }
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          },
        },
        {
          label: '重置缩放',
          accelerator: 'CommandOrControl+0',
          click: () => mainWindow?.webContents.setZoomFactor(1),
        },
        {
          label: '放大',
          accelerator: 'CommandOrControl+=',
          click: () => adjustZoom(0.1),
        },
        {
          label: '缩小',
          accelerator: 'CommandOrControl+-',
          click: () => adjustZoom(-0.1),
        },
        ...viewExtra,
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '操作说明',
          accelerator: 'F1',
          click: () => sendCommand('show-help'),
        },
        {
          label: '关于 st贪吃蛇',
          click: () => {
            void showAbout();
          },
        },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}

function attachNavigationGuards(win: BrowserWindow, devServerUrl: string | undefined): void {
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  win.webContents.on('will-navigate', (event, url) => {
    const allowed = devServerUrl
      ? url.startsWith(devServerUrl)
      : url.startsWith('file:');
    if (!allowed) {
      event.preventDefault();
    }
  });
}

async function createMainWindow(): Promise<void> {
  const resolved = resolveWindowState(readSavedWindowState(), currentDisplays());
  const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');

  const win = new BrowserWindow({
    x: resolved.x,
    y: resolved.y,
    width: resolved.width,
    height: resolved.height,
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
    backgroundColor: BACKGROUND,
    show: false,
    autoHideMenuBar: false,
    title: 'st贪吃蛇',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow = win;
  Menu.setApplicationMenu(buildMenu());

  if (resolved.isMaximized) {
    win.maximize();
  }

  const persist = () => {
    if (!mainWindow) {
      return;
    }
    writeSavedWindowState(captureWindowState(mainWindow));
  };

  win.on('resize', persist);
  win.on('move', persist);
  win.on('close', persist);
  win.on('closed', () => {
    if (mainWindow === win) {
      mainWindow = null;
    }
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL?.trim() || undefined;
  attachNavigationGuards(win, devServerUrl);

  if (devServerUrl) {
    await win.loadURL(devServerUrl);
  } else {
    await win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

function focusExistingWindow(): void {
  if (!mainWindow) {
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.show();
  mainWindow.focus();
}

isolateUserDataForTests();
app.setName('st贪吃蛇');

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    focusExistingWindow();
  });

  app.whenReady().then(() => {
    void createMainWindow();
  });

  app.on('window-all-closed', () => {
    app.quit();
  });
}
