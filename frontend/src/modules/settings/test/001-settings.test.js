import { test, expect } from '@playwright/test';

const route = '/settings';

test.beforeEach(async ({ page }) => await page.goto(route));

test('settings page renders', async ({ page }) => {
  const h = page.locator('h1, h2').first();
  await expect(h).toBeVisible();
});

test('settings panels visible', async ({ page }) => {
  const p = page.locator('[data-test="settings-panels"], .settings-panels');
  await expect(p).toBeVisible();
});
