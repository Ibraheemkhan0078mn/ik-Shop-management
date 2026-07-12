import { test, expect } from '@playwright/test';

const route = '/orders';

test.beforeEach(async ({ page }) => await page.goto(route));

test('orders page renders header', async ({ page }) => {
  const h = page.locator('h1, h2').first();
  await expect(h).toBeVisible();
});

test('orders table visible', async ({ page }) => {
  const t = page.locator('table, [data-test="orders-table"]');
  await expect(t).toBeVisible();
});
