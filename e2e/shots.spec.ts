import { test } from '@playwright/test';

const AI_TEXT = `Delve into the future of seamless productivity. Our cutting-edge, all-in-one platform empowers teams to unlock next-level results. Furthermore, it is important to note that leveraging robust innovation has never been easier. In conclusion, this game-changer will supercharge your workflow like never before.`;

test('capture', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto('/');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '/tmp/shot-hero.png', fullPage: true });

  await page.getByRole('tab', { name: 'AI Text' }).click();
  await page.getByPlaceholder(/suspect prose/)!.fill(AI_TEXT);
  await page.getByRole('button', { name: /Run 8 engines/ }).click();
  await page.locator('.gauge-num b').waitFor({ timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/shot-text.png', fullPage: true });
});
