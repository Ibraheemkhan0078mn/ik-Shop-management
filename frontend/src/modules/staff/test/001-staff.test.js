import { test, expect } from '@playwright/test';

const route = '/staff';

test.beforeEach(async ({ page }) => await page.goto(route));

test('staff page header visible', async ({ page }) => {
  const h = page.locator('h1, h2').first();
  await expect(h).toBeVisible();
});

test('staff list present', async ({ page }) => {
  const list = page.locator('table, [data-test="staff-list"]');
  await expect(list).toBeVisible();
});
