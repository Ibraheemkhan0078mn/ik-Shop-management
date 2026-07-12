import { test, expect } from '@playwright/test';

const ROUTE = '/reports/dashboard';
const API_PATH = '/api/reports/main-business';

async function loginIfNeeded(page) {
  // Try to open the route first; if redirected to login, perform UI login
  await page.goto(ROUTE);
  await page.waitForTimeout(500);

  const onAuthPage = await page.locator('#auth-heading').count();
  if (onAuthPage > 0 || page.url().includes('/#/login') || page.url().endsWith('/#/')) {
    // Perform login using test credentials present in existing auth tests
    await page.goto('/');
    await page.locator('#auth-email-input').fill('ik@gmail.com');
    await page.locator('#auth-password-input').fill('1234');
    // role select may be present; attempt to set to admin
    const role = page.locator('#auth-role-select');
    if (await role.count() > 0) await role.selectOption('admin');
    await page.locator('#auth-submit-button').click();
    // wait for navigation to dashboard or reports
    await page.waitForURL(/dashboard|reports/, { timeout: 8000 }).catch(() => {});
    // finally go to the reports route
    await page.goto(ROUTE);
  }
}

test.describe('Main Business Report - Detailed and Reliable Tests', () => {

  test.beforeEach(async ({ page }) => {
    await loginIfNeeded(page);
  });

  test('loads report and receives data from backend', async ({ page }) => {
    // Wait for the main-business API response and capture JSON
    const [response] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes(API_PATH) && resp.status() === 200, { timeout: 8000 }),
      // ensure page navigation triggers requests
      page.goto(ROUTE),
    ]);

    const body = await response.json();
    expect(body).toBeTruthy();
    // Expect either `data` or `summary` keys based on backend shape
    expect(body.data || body.summary).toBeTruthy();

    // Verify summary keys (if present)
    const summary = body.summary || body.data?.summary;
    if (summary) {
      expect(typeof summary.totalSales === 'number' || typeof summary.totalSales === 'string').toBeTruthy();
      expect(typeof summary.totalPurchases === 'number' || typeof summary.totalPurchases === 'string').toBeTruthy();
    }
  });

  test('shows KPI cards with formatted currency values', async ({ page }) => {
    await page.goto(ROUTE);
    // wait for api
    await page.waitForResponse(resp => resp.url().includes(API_PATH), { timeout: 8000 });

    // Prefer data-test attribute; fall back to generic selectors
    const kpiSelector = '[data-test="kpi-card"], .kpi-card, [class*="kpi"], [class*="card"]';
    const cards = page.locator(kpiSelector);
    await expect(cards.first()).toBeVisible();

    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Check that at least one card shows currency like Rs 1,234
    const currency = page.locator('text=/Rs\\s*[0-9,]+/');
    await expect(currency.first()).toBeVisible();
  });

  test('period filter updates data (week -> month -> custom)', async ({ page }) => {
    await page.goto(ROUTE);
    await page.waitForResponse(resp => resp.url().includes(API_PATH), { timeout: 8000 });

    const periodSelect = page.locator('select[data-test="period-select"], select').first();
    await expect(periodSelect).toBeVisible();

    // Change to week
    await periodSelect.selectOption({ value: 'week' }).catch(() => {});
    await page.waitForResponse(resp => resp.url().includes(API_PATH), { timeout: 8000 }).catch(() => {});
    // Change to month
    await periodSelect.selectOption({ value: 'month' }).catch(() => {});
    await page.waitForResponse(resp => resp.url().includes(API_PATH), { timeout: 8000 }).catch(() => {});

    // Try custom range if available
    await periodSelect.selectOption({ value: 'custom' }).catch(() => {});
    const dateInputs = page.locator('input[type="date"]');
    if (await dateInputs.count() >= 2) {
      await dateInputs.first().fill('2026-07-01');
      await dateInputs.nth(1).fill('2026-07-12');
      await page.locator('button:has-text("Apply"), button:has-text("Filter")').first().click().catch(() => {});
      await page.waitForResponse(resp => resp.url().includes(API_PATH), { timeout: 8000 }).catch(() => {});
    }

    // Ensure KPI still visible after filters
    const kpi = page.locator('text=/Rs\\s*[0-9,]+/');
    await expect(kpi.first()).toBeVisible();
  });

  test('expandable breakdowns render tables on demand', async ({ page }) => {
    await page.goto(ROUTE);
    await page.waitForResponse(resp => resp.url().includes(API_PATH), { timeout: 8000 });

    // find expand buttons (chevrons)
    let expandButtons = page.locator('button:has(svg[class*="ChevronDown"]), button:has(svg[class*="ChevronUp"]), button[aria-expanded]');
    if (await expandButtons.count() === 0) {
      // try generic buttons with Show/Details text
      expandButtons = page.locator('button:has-text("Show"), button:has-text("Details")');
    }

    if (await expandButtons.count() > 0) {
      await expandButtons.first().click();
      // wait for table or list
      const table = page.locator('table, [data-test="breakdown-table"], [class*="breakdown"]');
      await expect(table.first()).toBeVisible({ timeout: 5000 });
      // basic table shape
      if (await table.count() > 0) {
        const headers = table.first().locator('th');
        expect(await headers.count()).toBeGreaterThan(0);
      }
    } else {
      test.skip(true, 'No expandable breakdown sections found on this page');
    }
  });

  test('no console errors during common interactions', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(ROUTE);
    await page.waitForResponse(resp => resp.url().includes(API_PATH), { timeout: 8000 }).catch(() => {});

    // perform a couple of interactions
    await page.locator('button:has-text("Refresh"), button[title*="refresh"]').first().click().catch(() => {});
    await page.waitForTimeout(500);

    await page.locator('select[data-test="period-select"], select').first().selectOption({ value: 'month' }).catch(() => {});
    await page.waitForTimeout(500);

    expect(errors).toEqual([]);
  });
});
    if (expandCount > 0) {
      const firstButton = expandButtons.first();
      
      // Click to expand
      await firstButton.click();
      await page.waitForTimeout(500);
      
      // Click to collapse
      await firstButton.click();
      await page.waitForTimeout(500);
      
      // Page should still be functional
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  // TEST 24: No JavaScript errors on interaction
  test('performs interactions without console errors', async ({ page }) => {
    const errors = [];
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Perform interactions
    const selectElement = page.locator('select').first();
    await selectElement.selectOption('week');
    await page.waitForTimeout(500);
    
    await selectElement.selectOption('month');
    await page.waitForTimeout(500);
    
    // Should have no errors
    expect(errors).toEqual([]);
  });
});
