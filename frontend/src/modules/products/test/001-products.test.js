import { test, expect } from '@playwright/test';

const route = '/products';

test.beforeEach(async ({ page }) => await page.goto(route));

test('products page heading visible', async ({ page }) => {
  const h = page.locator('h1, h2').first();
  await expect(h).toBeVisible();
});

test('products grid or table present', async ({ page }) => {
  const grid = page.locator('table, [data-test="products-grid"]');
  await expect(grid).toBeVisible();
});
