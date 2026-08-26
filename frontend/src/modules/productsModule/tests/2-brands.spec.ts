import { test, expect, Page } from '@playwright/test';

const BULK_COUNT = 50;

// ── helpers ────────────────────────────────────────────────────
async function openCreateModal(page: Page) {
  await page.waitForSelector('#brands-add-button', { state: 'visible', timeout: 10000 });
  await page.click('#brands-add-button');
  await page.waitForSelector('#brand-modal', { state: 'visible' });
}

async function setActive(page: Page, active: boolean) {
  const isChecked = await page.isChecked('#brand-active-checkbox');
  if (isChecked !== active) {
    await page.click('[data-testid="brand-active-label"]');
  }
}

// Creates a brand and waits for the real create API response, so the
// test asserts on backend data instead of guessing from the DOM.
async function createBrand(page: Page, name: string, isActive: boolean) {
  await openCreateModal(page);
  await page.fill('#brand-name-input', name);
  await setActive(page, isActive);

  const [response] = await Promise.all([
    page.waitForResponse((res) => res.url().includes('/api/brands') && res.request().method() === 'POST'),
    page.click('#brand-modal-submit'),
  ]);

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  const created = body?.data ?? body;

  await page.waitForSelector('#brand-modal', { state: 'hidden' });
  return created;
}

function rowByName(page: Page, name: string) {
  return page.locator('[data-testid^="brand-row-"]', { hasText: name });
}

async function extractItems(body: any) {
  return body?.data?.items ?? body?.data ?? [];
}

test.describe('Brands Section - E2E + API Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    await page.fill('#auth-email-input', 'ik@gmail.com');
    await page.fill('#auth-password-input', '1234567');
    await page.click('#auth-submit-button');

    await page.waitForURL('**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Navigate via sidebar — required flow per spec, not a direct goto
    await page.click('[data-testid="sidebar-nav-products"]');
    await page.click('[data-testid="sidebar-nav-brands"]');
    await page.waitForURL('**/auth#/products/brands', { timeout: 10000 });

    // Let the initial list load settle before each test starts
    await page.waitForResponse((res) => res.url().includes('/getPaginationBrands'));
  });

  test('1. Create brand (active) — UI + API data match', async ({ page }) => {
    const name = `Active Brand ${Date.now()}`;

    const created = await createBrand(page, name, true);
    expect(created.name).toBe(name);
    expect(created.isActive).toBe(true);
    expect(created).toHaveProperty('_id');

    const row = rowByName(page, name);
    await expect(row).toBeVisible();
    await expect(row.locator('[data-testid^="brand-status-"]')).toHaveText(/active/i);

    // Cross-check against a fresh GET, not just the create response
    const getRes = await page.request.get('/api/brands/getPaginationBrands', {
      params: { page: '1', limit: '10' },
    });
    const items = await extractItems(await getRes.json());
    const match = items.find((b: any) => b._id === created._id);
    expect(match?.name).toBe(name);
    expect(match?.isActive).toBe(true);
  });

  test('2. Create brand (inactive) — UI + API data match', async ({ page }) => {
    const name = `Inactive Brand ${Date.now()}`;

    const created = await createBrand(page, name, false);
    expect(created.isActive).toBe(false);

    const row = rowByName(page, name);
    await expect(row).toBeVisible();
    await expect(row.locator('[data-testid^="brand-status-"]')).toHaveText(/inactive/i);
  });

  test('3. Update a brand — UI + API reflect the change', async ({ page }) => {
    const originalName = `Brand To Edit ${Date.now()}`;
    const updatedName = `Updated Brand ${Date.now()}`;

    const created = await createBrand(page, originalName, true);
    const id = created._id;

    await page.click(`#brand-edit-${id}`);
    await page.waitForSelector('#brand-modal', { state: 'visible' });
    await expect(page.locator('#brand-modal-title')).toContainText('Edit');

    await page.fill('#brand-name-input', updatedName);
    await setActive(page, false);

    const [updateRes] = await Promise.all([
      page.waitForResponse((res) => res.url().includes(`/api/brands/${id}`) && res.request().method() === 'PUT'),
      page.click('#brand-modal-submit'),
    ]);
    expect(updateRes.ok()).toBeTruthy();
    const updated = (await updateRes.json())?.data ?? (await updateRes.json());
    expect(updated.name).toBe(updatedName);
    expect(updated.isActive).toBe(false);

    await page.waitForSelector('#brand-modal', { state: 'hidden' });

    const row = page.locator(`[data-testid="brand-row-${id}"]`);
    await expect(row.locator(`[data-testid="brand-name-${id}"]`)).toHaveText(updatedName);
    await expect(row.locator(`[data-testid="brand-status-${id}"]`)).toHaveText(/inactive/i);

    // Confirm via direct API read too
    const getRes = await page.request.get(`/api/brands/getBrandById/${id}`);
    const fetched = (await getRes.json())?.data ?? {};
    expect(fetched.name).toBe(updatedName);
    expect(fetched.isActive).toBe(false);
  });

  test('4. Delete a brand — removed from UI and API', async ({ page }) => {
    const name = `Brand To Delete ${Date.now()}`;
    const created = await createBrand(page, name, true);
    const id = created._id;

    await page.click(`#brand-delete-${id}`);
    await page.click('[data-testid="confirm-yes-button"]');

    const deleteRes = await page.waitForResponse(
      (res) => res.url().includes(`/api/brands/${id}`) && res.request().method() === 'DELETE'
    );
    expect(deleteRes.ok()).toBeTruthy();

    await expect(page.locator(`[data-testid="brand-row-${id}"]`)).toHaveCount(0);

    // Confirm gone via API too
    const getRes = await page.request.get(`/api/brands/getBrandById/${id}`);
    expect(getRes.ok()).toBeFalsy();
  });

  test('5. Bulk create 50 brands (active/inactive) and validate pagination', async ({ page }) => {
    const created: { id: string; name: string; isActive: boolean }[] = [];

    for (let i = 0; i < BULK_COUNT; i++) {
      const name = `Bulk Brand ${Date.now()}-${i}`;
      const isActive = i % 2 === 0; // deterministic — keeps the test reproducible

      const brand = await createBrand(page, name, isActive);
      created.push({ id: brand._id, name, isActive });
    }

    expect(created).toHaveLength(BULK_COUNT);

    // Validate against the API directly across every page
    const limit = 10;
    const firstPageBody = await (
      await page.request.get('/api/brands/getPaginationBrands', { params: { page: '1', limit: String(limit) } })
    ).json();
    const total = firstPageBody?.data?.total ?? firstPageBody?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    expect(total).toBeGreaterThanOrEqual(BULK_COUNT);

    const allItems: any[] = [];
    for (let p = 1; p <= totalPages; p++) {
      const body = await (
        await page.request.get('/api/brands/getPaginationBrands', { params: { page: String(p), limit: String(limit) } })
      ).json();
      allItems.push(...(await extractItems(body)));
    }

    for (const b of created) {
      const match = allItems.find((x) => x._id === b.id);
      expect(match, `brand ${b.name} missing from API results`).toBeTruthy();
      expect(match.isActive).toBe(b.isActive);
    }

    // UI pagination: reload to page 1, then walk forward/back through the app
    await page.reload();
    await page.waitForResponse((res) => res.url().includes('/getPaginationBrands'));
    await page.click('[data-testid="sidebar-nav-products"]');
    await page.click('[data-testid="sidebar-nav-brands"]');
    await page.waitForURL('**/auth#/products/brands');

    const nextBtn = page.locator('[data-testid="pagination-next"]');
    const prevBtn = page.locator('[data-testid="pagination-prev"]');
    await expect(nextBtn).toBeVisible();

    if (totalPages > 1) {
      const page1Ids = await page.locator('[data-testid^="brand-row-"]').evaluateAll((rows) =>
        rows.map((r) => r.getAttribute('data-testid'))
      );
      expect(page1Ids.length).toBeGreaterThan(0);

      const [navRes] = await Promise.all([
        page.waitForResponse((res) => res.url().includes('/getPaginationBrands')),
        nextBtn.click(),
      ]);
      const page2Items = await extractItems(await navRes.json());
      expect(page2Items.length).toBeGreaterThan(0);

      const page2Ids = await page.locator('[data-testid^="brand-row-"]').evaluateAll((rows) =>
        rows.map((r) => r.getAttribute('data-testid'))
      );
      expect(page2Ids.length).toBeGreaterThan(0);

      // Prove the data actually changed between pages, not just the page number
      expect(page2Ids).not.toEqual(page1Ids);

      await Promise.all([
        page.waitForResponse((res) => res.url().includes('/getPaginationBrands')),
        prevBtn.click(),
      ]);
    }
  });
});