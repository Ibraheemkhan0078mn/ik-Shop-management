import { test, expect } from '@playwright/test';

const route = '/expenses';

test.beforeEach(async ({ page }) => await page.goto(route));

test('expenses page shows header', async ({ page }) => {
  const h = page.locator('h1, h2').first();
  await expect(h).toBeVisible();
});

test('expenses list or table present', async ({ page }) => {
  const list = page.locator('table, [data-test="expenses-list"]');
  await expect(list).toBeVisible();
});
