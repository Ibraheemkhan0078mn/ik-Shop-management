import { test, expect } from '@playwright/test';

const route = '/suppliers';

test.beforeEach(async ({ page }) => await page.goto(route));

test('suppliers page renders', async ({ page }) => {
  const h = page.locator('h1, h2').first();
  await expect(h).toBeVisible();
});

test('suppliers list exists', async ({ page }) => {
  const list = page.locator('table, [data-test="suppliers-list"]');
  await expect(list).toBeVisible();
});
