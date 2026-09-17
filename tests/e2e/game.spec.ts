import { expect, test } from '@playwright/test';

test('menu shows the game name and can start, pause and resume from the keyboard', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'st贪吃蛇' })).toBeVisible();
  await expect(page.getByRole('button', { name: '开始游戏' })).toBeVisible();
  await expect(page.getByTestId('score')).toHaveText('0');

  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: '暂停' })).toBeVisible();

  await page.keyboard.press('p');
  await expect(page.getByRole('heading', { name: '暂停' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: '暂停' })).toBeVisible();
});
