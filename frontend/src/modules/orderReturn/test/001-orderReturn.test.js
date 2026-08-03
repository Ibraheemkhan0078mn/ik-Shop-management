import { test, expect } from '@playwright/test';

const route = '/order-returns';

test.beforeEach(async ({ page }) => await page.goto(route));

test('order return page header visible', async ({ page }) => {
  const h = page.locator('h1, h2').first();
  await expect(h).toBeVisible();
});

test('order return list present', async ({ page }) => {
  const list = page.locator('table, [data-test="order-returns-list"]');
  await expect(list).toBeVisible();
});
