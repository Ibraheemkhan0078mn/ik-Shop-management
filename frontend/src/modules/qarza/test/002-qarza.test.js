import { test, expect } from '@playwright/test';

const api = '/api/qarza';

test('qarza API returns data', async ({ page }) => {
  const r = await page.evaluate(async (api) => {
    try {
      const res = await fetch(api);
      const j = await res.json();
      return { ok: res.ok, status: res.status, hasData: j && (Array.isArray(j?.data) || j?.total !== undefined) };
    } catch (e) {
      return { error: e.message };
    }
  }, api);

  expect(r.ok).toBe(true);
  expect(r.status).toBe(200);
});
