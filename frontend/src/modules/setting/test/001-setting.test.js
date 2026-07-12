import { test, expect } from '@playwright/test';

const route = '/setting';

test.beforeEach(async ({ page }) => await page.goto(route));

test('setting page header visible', async ({ page }) => {
  const h = page.locator('h1, h2').first();
  await expect(h).toBeVisible();
});

test('setting sections present', async ({ page }) => {
  const s = page.locator('[data-test="settings-sections"], .settings-sections');
  await expect(s).toBeVisible();
});
