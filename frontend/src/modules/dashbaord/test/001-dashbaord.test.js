import { test, expect } from '@playwright/test';

const route = '/dashboard';

test.beforeEach(async ({ page }) => await page.goto(route));

test('dashboard main widgets should render', async ({ page }) => {
  const widgets = page.locator('[data-test="kpi-card"], .kpi-card');
  await expect(widgets.first()).toBeVisible();
});

test('recent activity or notifications visible', async ({ page }) => {
  const recent = page.locator('[data-test="recent-activity"], .recent-activity');
  await expect(recent).toBeVisible();
});
