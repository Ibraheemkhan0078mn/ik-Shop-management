import { test, expect } from '@playwright/test';

const route = '/product-purchases';

test.beforeEach(async ({ page }) => await page.goto(route));

test('product purchases page header visible', async ({ page }) => {
  const h = page.locator('h1, h2').first();
  await expect(h).toBeVisible();
});

test('purchases table visible', async ({ page }) => {
  const t = page.locator('table, [data-test="purchases-table"]');
  await expect(t).toBeVisible();
});
