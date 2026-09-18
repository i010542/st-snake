import { expect, test, _electron as electron, type ElectronApplication, type Page } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function launchApp(): Promise<{ app: ElectronApplication; page: Page }> {
  const userData = mkdtempSync(join(tmpdir(), 'st-snake-e2e-'));
  const app = await electron.launch({
    args: ['.'],
    env: {
      ...process.env,
      ST_SNAKE_E2E: '1',
      ST_SNAKE_USER_DATA: userData,
      VITE_DEV_SERVER_URL: '',
    },
  });
  const page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  return { app, page };
}

test('production electron smoke: window, play, menu, settings, exit', async () => {
  const { app, page } = await launchApp();

  expect(app.windows()).toHaveLength(1);
  await expect(page).toHaveTitle('st贪吃蛇');
  await expect(page.getByRole('heading', { name: 'st贪吃蛇' })).toBeVisible();
  await expect(page.getByRole('button', { name: '开始游戏' })).toBeVisible();

  await page.getByRole('button', { name: '开始游戏' }).click();
  await expect(page.getByTestId('phase-status')).toContainText('进行中');

  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('p');
  await expect(page.getByRole('heading', { name: '暂停' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('phase-status')).toContainText('进行中');

  await app.evaluate(async ({ Menu }) => {
    const menu = Menu.getApplicationMenu();
    const gameMenu = menu?.items.find((item) => item.label === '游戏');
    const newGame = gameMenu?.submenu?.items.find((item) => item.label === '新游戏');
    newGame?.click();
  });
  await expect(page.getByTestId('phase-status')).toContainText('进行中');
  await expect(page.getByTestId('score')).toHaveText('0');

  await page.getByRole('button', { name: '设置' }).click();
  await expect(page.getByTestId('settings-dialog')).toBeVisible();
  await expect(page.getByTestId('phase-status')).toContainText('已暂停');
  await page.getByRole('button', { name: '关闭' }).click();
  await expect(page.getByTestId('settings-dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '暂停' })).toBeVisible();

  const processRef = app.process();
  await page.close();
  await app.close();
  expect(processRef?.killed || processRef?.exitCode !== null).toBeTruthy();
});

test('after a wall death, restart stays running instead of dying immediately', async () => {
  const { app, page } = await launchApp();

  await page.getByRole('button', { name: '开始游戏' }).click();
  await expect(page.getByTestId('phase-status')).toContainText('进行中');
  await expect(page.getByRole('alert')).toBeVisible({ timeout: 4000 });
  await expect(page.getByRole('alert')).toContainText('撞墙');

  await page.getByRole('button', { name: '重新开始' }).click();
  await expect(page.getByTestId('phase-status')).toContainText('进行中');
  await expect(page.getByRole('button', { name: '暂停' })).toBeVisible();
  await page.waitForTimeout(400);
  await expect(page.getByTestId('phase-status')).toContainText('进行中');
  await expect(page.getByRole('alert')).toHaveCount(0);

  await app.close();
});
