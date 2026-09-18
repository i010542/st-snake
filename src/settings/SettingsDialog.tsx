import { useEffect, useRef } from 'react';
import { MAX_CPS, MIN_CPS } from '../game/constants';
import type { AppSettings } from './settings';

interface SettingsDialogProps {
  settings: AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
  onRestoreDefaults: () => void;
  onClose: () => void;
}

export function SettingsDialog({
  settings,
  onChange,
  onRestoreDefaults,
  onClose,
}: SettingsDialogProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        data-testid="settings-dialog"
      >
        <h2 id="settings-title">设置</h2>
        <p className="modal-lead">更改会立即生效并保存到本机。Esc 可关闭设置。</p>

        <label className="field" htmlFor="settings-speed">
          <span>游戏速度</span>
          <input
            id="settings-speed"
            data-testid="settings-speed"
            type="range"
            min={MIN_CPS}
            max={MAX_CPS}
            step={1}
            value={settings.speedCps}
            aria-valuemin={MIN_CPS}
            aria-valuemax={MAX_CPS}
            aria-valuenow={settings.speedCps}
            aria-valuetext={`${settings.speedCps} 格每秒`}
            onChange={(event) => onChange({ speedCps: Number(event.target.value) })}
          />
          <span data-testid="settings-speed-readout">{settings.speedCps} 格/秒</span>
        </label>

        <label className="field field-check" htmlFor="settings-sound">
          <input
            id="settings-sound"
            data-testid="settings-sound"
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(event) => onChange({ soundEnabled: event.target.checked })}
          />
          <span>音效</span>
        </label>

        <label className="field" htmlFor="settings-volume">
          <span>音量</span>
          <input
            id="settings-volume"
            data-testid="settings-volume"
            type="range"
            min={0}
            max={100}
            step={1}
            value={settings.volume}
            disabled={!settings.soundEnabled}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={settings.volume}
            aria-valuetext={`${settings.volume} 百分之`}
            onChange={(event) => onChange({ volume: Number(event.target.value) })}
          />
          <span data-testid="settings-volume-readout">{settings.volume}</span>
        </label>

        <label className="field field-check" htmlFor="settings-grid">
          <input
            id="settings-grid"
            data-testid="settings-grid"
            type="checkbox"
            checked={settings.gridVisible}
            onChange={(event) => onChange({ gridVisible: event.target.checked })}
          />
          <span>显示网格</span>
        </label>

        <div className="actions">
          <button type="button" onClick={onRestoreDefaults} data-testid="restore-defaults">
            恢复默认设置
          </button>
          <button ref={closeRef} type="button" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
