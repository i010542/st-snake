import { expect, test, type Page } from '@playwright/test';

async function startAndPause(page: Page): Promise<void> {
  await page.getByRole('button', { name: '开始游戏' }).click();
  await page.keyboard.press('p');
  await expect(page.getByRole('heading', { name: '暂停' })).toBeVisible();
}

test('menu shows the game name and scores', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'st贪吃蛇' })).toBeVisible();
  await expect(page.getByRole('button', { name: '开始游戏' })).toBeVisible();
  await expect(page.getByTestId('score')).toHaveText('0');
  await expect(page.getByTestId('high-score')).toHaveText('0');
  await expect(page.getByTestId('speed-slider')).toBeVisible();
  await expect(page.getByTestId('speed-readout')).toContainText('8 格/秒');
});

test('keyboard can start, pause, resume, die, and restart', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: '开始游戏' })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: '暂停' })).toBeVisible();

  await page.keyboard.press('p');
  await expect(page.getByRole('heading', { name: '暂停' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: '暂停' })).toBeVisible();

  await expect(page.getByRole('alert')).toBeVisible({ timeout: 4000 });
  await expect(page.getByRole('alert')).toContainText('撞墙');

  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: '暂停' })).toBeVisible();
  await expect(page.getByTestId('score')).toHaveText('0');
});

test('paused board stays frozen until resume', async ({ page }) => {
  await page.goto('/');
  await startAndPause(page);
  const label = await page.getByRole('img').getAttribute('aria-label');
  await page.waitForTimeout(400);
  await expect(page.getByRole('img')).toHaveAttribute('aria-label', label ?? '');
  await page.getByRole('button', { name: '继续' }).click();
  await expect(page.getByRole('button', { name: '暂停' })).toBeVisible();
});
