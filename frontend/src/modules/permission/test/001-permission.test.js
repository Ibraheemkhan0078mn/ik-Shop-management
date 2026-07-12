import { test, expect } from '@playwright/test';

const route = '/permissions';

test.beforeEach(async ({ page }) => await page.goto(route));

test('permissions page renders', async ({ page }) => {
  const h = page.locator('h1, h2').first();
  await expect(h).toBeVisible();
});

test('permissions list/table present', async ({ page }) => {
  const t = page.locator('table, [data-test="permissions-list"]');
  await expect(t).toBeVisible();
});
