import { test, expect } from '@playwright/test';

const route = '/qarza';

test.beforeEach(async ({ page }) => await page.goto(route));

test('qarza page renders', async ({ page }) => {
  const h = page.locator('h1, h2').first();
  await expect(h).toBeVisible();
});

test('qarza list or summary present', async ({ page }) => {
  const s = page.locator('[data-test="qarza-list"], .qarza-summary');
  await expect(s).toBeVisible();
});
