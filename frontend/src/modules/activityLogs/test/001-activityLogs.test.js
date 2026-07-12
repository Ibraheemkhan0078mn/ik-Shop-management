import { test, expect } from '@playwright/test';

// Basic UI smoke tests for Activity Logs module
// Note: update the `route` and selectors below if your app uses different paths or ids
const route = '/activity-logs';

test.describe('Activity Logs - Basic UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(route);
  });

  test('page loads and heading is visible', async ({ page }) => {
    const h = page.locator('h1, h2').first();
    await expect(h).toBeVisible();
  });

  test('logs table or list is present', async ({ page }) => {
    const table = page.locator('table');
    const list = page.locator('[data-test="activity-list"]');
    await expect(table.or(list)).toBeVisible();
  });
});
