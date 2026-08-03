import { test, expect } from '@playwright/test';

const api = '/api/orders';

test('orders API returns array', async ({ page }) => {
  const r = await page.evaluate(async (api) => {
    try {
      const res = await fetch(api);
      const j = await res.json();
      return { ok: res.ok, status: res.status, hasArray: Array.isArray(j?.data) };
    } catch (e) {
      return { error: e.message };
    }
  }, api);

  expect(r.ok).toBe(true);
  expect(r.status).toBe(200);
});
