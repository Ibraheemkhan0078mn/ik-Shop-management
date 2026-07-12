import { test, expect } from '@playwright/test';

// Backend verification for Activity Logs
const apiPath = '/api/activity-logs';

test('backend returns activity log data', async ({ page }) => {
  const result = await page.evaluate(async (api) => {
    try {
      const r = await fetch(api);
      const j = await r.json();
      return { ok: r.ok, status: r.status, hasItems: Array.isArray(j?.data) };
    } catch (e) {
      return { error: e.message };
    }
  }, apiPath);

  expect(result.ok).toBe(true);
  expect(result.status).toBe(200);
  expect(result.hasItems).toBeDefined();
});
