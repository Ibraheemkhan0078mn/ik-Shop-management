import { test, expect } from '@playwright/test';

const api = '/api/pos';

test('POS API responds', async ({ page }) => {
  const r = await page.evaluate(async (api) => {
    try {
      const res = await fetch(api);
      return { ok: res.ok, status: res.status };
    } catch (e) {
      return { error: e.message };
    }
  }, api);

  expect(r.ok).toBe(true);
  expect(r.status).toBe(200);
});
