import { test, expect } from '@playwright/test';

const route = '/pos';

test.beforeEach(async ({ page }) => await page.goto(route));

test('POS page displays header', async ({ page }) => {
  const h = page.locator('h1, h2').first();
  await expect(h).toBeVisible();
});

test('cart or terminal visible', async ({ page }) => {
  const cart = page.locator('[data-test="pos-cart"], .pos-cart, .terminal');
  await expect(cart).toBeVisible();
});
