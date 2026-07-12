import { test, expect } from '@playwright/test';

const route = '/purchase-returns';

test.beforeEach(async ({ page }) => await page.goto(route));

test('purchase return page shows header', async ({ page }) => {
  const h = page.locator('h1, h2').first();
  await expect(h).toBeVisible();
});

test('purchase returns list/table present', async ({ page }) => {
  const t = page.locator('table, [data-test="purchase-returns-list"]');
  await expect(t).toBeVisible();
});
