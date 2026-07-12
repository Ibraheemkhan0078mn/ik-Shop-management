import { test, expect } from '@playwright/test';

const route = '/wastage';

test.beforeEach(async ({ page }) => await page.goto(route));

test('wastage page renders header', async ({ page }) => {
  const h = page.locator('h1, h2').first();
  await expect(h).toBeVisible();
});

test('wastage list present', async ({ page }) => {
  const list = page.locator('table, [data-test="wastage-list"]');
  await expect(list).toBeVisible();
});
