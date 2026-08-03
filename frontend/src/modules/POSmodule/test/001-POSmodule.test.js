import { test, expect } from '@playwright/test';

const route = '/pos';

test.beforeEach(async ({ page }) => await page.goto(route));

test('POS module main view visible', async ({ page }) => {
  const el = page.locator('[data-test="pos-app"], .pos-app');
  await expect(el).toBeVisible();
});

test('POS product list or search visible', async ({ page }) => {
  const p = page.locator('[data-test="pos-products"], .pos-products');
  await expect(p).toBeVisible();
});
