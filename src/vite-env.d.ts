/// <reference types="vite/client" />

import type { DesktopBridge } from './desktop/bridge';

declare global {
  interface Window {
    desktop?: DesktopBridge;
  }
}

export {};
