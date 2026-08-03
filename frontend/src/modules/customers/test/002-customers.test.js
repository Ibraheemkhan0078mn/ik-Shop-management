import { test, expect } from '@playwright/test';

const api = '/api/customers';

test('backend returns customer list', async ({ page }) => {
  const res = await page.evaluate(async (api) => {
    try {
      const r = await fetch(api);
      const j = await r.json();
      return { ok: r.ok, status: r.status, hasArray: Array.isArray(j?.data) };
    } catch (e) {
      return { error: e.message };
    }
  }, api);

  expect(res.ok).toBe(true);
  expect(res.status).toBe(200);
});
