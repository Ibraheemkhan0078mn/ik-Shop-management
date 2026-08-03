import { test, expect } from '@playwright/test';

const route = '/inventory';

test.beforeEach(async ({ page }) => await page.goto(route));

test('inventory page renders heading', async ({ page }) => {
  const h = page.locator('h1, h2').first();
  await expect(h).toBeVisible();
});

test('stock table visible', async ({ page }) => {
  const t = page.locator('table, [data-test="stock-table"]');
  await expect(t).toBeVisible();
});
