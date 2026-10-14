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

  // Capture the generated slop-receipt PNG via the Screenshot lab + Share.
  await page.getByRole('tab', { name: 'Screenshot' }).click();
  const buf = await page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 400; c.height = 300;
    const x = c.getContext('2d')!;
    x.fillStyle = '#f5f4f0'; x.fillRect(0, 0, 400, 300);
    x.fillStyle = '#8b5cf6'; x.fillRect(40, 60, 320, 120);
    const b: Blob = await new Promise((res) => c.toBlob((v) => res(v!), 'image/png'));
    return Array.from(new Uint8Array(await b.arrayBuffer()));
  });
  await page.locator('input[type="file"]').setInputFiles({ name: 'shot.png', mimeType: 'image/png', buffer: Buffer.from(buf) });
  await page.locator('#result .verdict').waitFor({ timeout: 15000 });
  const [dl] = await Promise.all([
    page.waitForEvent('download', { timeout: 8000 }),
    page.getByRole('button', { name: /Share your shame/ }).click(),
  ]);
  await dl.saveAs('/tmp/shot-receipt.png');
});
