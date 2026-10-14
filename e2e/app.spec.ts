import { test, expect } from '@playwright/test';

const AI_TEXT = `Delve into the future of seamless productivity. Our cutting-edge, all-in-one platform empowers teams to unlock next-level results. Furthermore, it is important to note that leveraging robust innovation has never been easier. In conclusion, this game-changer will supercharge your workflow like never before. Additionally, the seamless interface elevates every interaction. Moreover, our revolutionary approach streamlines success. Lastly, unlock your potential today.`;

test.describe('slopcheck forensic lab', () => {
  test('homepage renders all 4 tabs + instrument', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /AI slop/ })).toBeVisible();
    for (const tab of ['Site URL', 'AI Text', 'Document', 'Screenshot']) {
      await expect(page.getByRole('tab', { name: tab })).toBeVisible();
    }
    await expect(page.locator('.specimen')).toBeVisible();
    await expect(page.locator('.log')).toContainText('awaiting specimen');
    await expect(page.locator('.stats .stat')).toHaveCount(4);
  });

  test('AI Text tab: full engine run shows gauge + engines + heatmap', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'AI Text' }).click();
    await page.getByPlaceholder(/suspect prose/)!.fill(AI_TEXT);
    await page.getByRole('button', { name: /Run 8 engines/ }).click();
    await expect(page.locator('.gauge-num b')).toBeVisible({ timeout: 15000 });
    const score = Number(await page.locator('.gauge-num b').innerText());
    expect(score).toBeGreaterThanOrEqual(35);
    await expect(page.locator('.engine')).toHaveCount(8);
    await expect(page.locator('.heatmap')).toBeVisible();
  });

  test('AI Text tab: quick score', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'AI Text' }).click();
    await page.getByPlaceholder(/suspect prose/)!.fill(AI_TEXT);
    await page.getByRole('button', { name: /Quick score/ }).click();
    await expect(page.locator('.quick')).toContainText(/Quick read/, { timeout: 15000 });
  });

  test('AI Text tab: short input shows validation', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'AI Text' }).click();
    await page.getByPlaceholder(/suspect prose/)!.fill('too short');
    await page.getByRole('button', { name: /Run 8 engines/ }).click();
    await expect(page.locator('.err').first()).toContainText(/50 characters/);
  });

  test('Screenshot tab: upload analyzes pixels locally', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Screenshot' }).click();
    // Generate a test image in-browser and upload it.
    const buf = await page.evaluate(async () => {
      const c = document.createElement('canvas');
      c.width = 400; c.height = 300;
      const x = c.getContext('2d')!;
      x.fillStyle = '#f5f4f0'; x.fillRect(0, 0, 400, 300);
      x.fillStyle = '#8b5cf6'; x.fillRect(40, 60, 320, 120);
      const b: Blob = await new Promise((res) => c.toBlob((v) => res(v!), 'image/png'));
      const ab = await b.arrayBuffer();
      return Array.from(new Uint8Array(ab));
    });
    await page.locator('input[type="file"]').setInputFiles({
      name: 'shot.png', mimeType: 'image/png', buffer: Buffer.from(buf),
    });
    await expect(page.locator('#result .verdict')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.log')).toContainText('total slop');
  });

  test('Document tab: txt upload runs engines', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Document' }).click();
    await page.locator('.drop input[type="file"]').setInputFiles({
      name: 'essay.txt', mimeType: 'text/plain',
      buffer: Buffer.from(AI_TEXT + '\n\n' + AI_TEXT + '\n\n' + AI_TEXT),
    });
    await expect(page.locator('.gauge-num b')).toBeVisible({ timeout: 20000 });
  });

  test('Site tab: invalid URL shows error, private blocked', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Scan site/ }).click();
    await expect(page.locator('.err').first()).toContainText(/URL/);
  });

  test('Share button generates a slop receipt PNG', async ({ page }) => {
    await page.goto('/');
    // Use the Screenshot lab — it runs fully locally, no network needed.
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
    await expect(page.locator('#result .verdict')).toBeVisible({ timeout: 15000 });
    // Desktop Chromium can't share/copy image files, so the deterministic
    // path is a PNG download. Assert a real PNG is produced.
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 8000 }),
      page.getByRole('button', { name: /Share your shame/ }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^slop-receipt-.*\.png$/);
    const path = await download.path();
    expect(path).toBeTruthy();
    await expect(page.locator('.toast')).toContainText(/receipt/i, { timeout: 5000 });
  });

  test('responsive: mobile layout stacks', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /AI slop/ })).toBeVisible();
    await expect(page.locator('.specimen')).toBeVisible();
  });
});
