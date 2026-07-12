import { test, expect } from '@playwright/test';

const route = '/customers';

test.describe('Customers - Basic UI', () => {
  test.beforeEach(async ({ page }) => await page.goto(route));

  test('page heading visible', async ({ page }) => {
    const h = page.locator('h1, h2').first();
    await expect(h).toBeVisible();
  });

  test('customer table or grid present', async ({ page }) => {
    const grid = page.locator('table, [data-test="customers-grid"]');
    await expect(grid).toBeVisible();
  });
});
