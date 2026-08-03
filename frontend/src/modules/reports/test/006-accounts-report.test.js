import { test, expect } from '@playwright/test';

const route = '/reports/accounts';

test.beforeEach(async ({ page }) => await page.goto(route));

test('accounts report renders summary cards', async ({ page }) => {
  const cards = page.locator('[data-test="kpi-card"]');
  await expect(cards).toBeVisible();
});
