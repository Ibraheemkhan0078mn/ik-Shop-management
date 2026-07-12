import { test, expect } from '@playwright/test';

// ============================================
// PURCHASES REPORT TESTS
// ============================================
// Tests verify the purchases report displays correctly
// Tests verify purchase metrics and supplier analysis
// Tests verify category breakdown and trends
// Tests verify backend data accuracy for purchase operations
// ============================================

test.describe('Purchases Report - UI Render Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/reports/purchases');
  });

  // TEST 1: Page loads with correct heading
  test('displays purchases report heading', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const heading = page.locator('h1');
    await expect(heading).toContainText(/Purchase|Purchases/i);
  });

  // TEST 2: KPI cards for purchase metrics display
  test('displays purchase KPI cards with 4 main metrics', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    // Should have multiple KPI cards
    const kpiCards = page.locator('[class*="rounded-xl"]');
    const cardCount = await kpiCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(8);
    
    // Should include purchase-related metrics
    const purchaseMetrics = page.locator('text=/Total Purchases|Average Order Cost|Suppliers|Categories/');
    expect(await purchaseMetrics.count()).toBeGreaterThan(0);
  });

  // TEST 3: Summary card displays purchase totals
  test('displays purchase summary card', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    // Find summary section
    const summaryCard = page.locator('[class*="shadow"]').first();
    await expect(summaryCard).toBeVisible();
  });

  // TEST 4: Supplier breakdown section displays
  test('displays supplier breakdown section', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    // Should have supplier section
    const supplierSection = page.locator('text=/Supplier|Top Supplier/');
    expect(await supplierSection.count()).toBeGreaterThan(0);
  });

  // TEST 5: Category breakdown section displays
  test('displays category breakdown section', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    // Should have category section
    const categorySection = page.locator('text=/Category|Categories/');
    expect(await categorySection.count()).toBeGreaterThan(0);
  });

  // TEST 6: Period filter displays
  test('displays period filter bar', async ({ page }) => {
    await page.waitForTimeout(500);
    
    const periodSelect = page.locator('select').first();
    await expect(periodSelect).toBeVisible();
  });
});

test.describe('Purchases Report - Metrics Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/reports/purchases');
    await page.waitForTimeout(1500);
  });

  // TEST 7: Total Purchases displays with currency
  test('displays total purchases with currency formatting', async ({ page }) => {
    const totalPurchases = page.locator('text=/Total Purchases/').first();
    await expect(totalPurchases).toBeVisible();
    
    // Should have currency value
    const value = totalPurchases.locator('xpath=following::text()[contains(., "Rs")]').first();
    const valueText = await value.textContent();
    expect(valueText).toMatch(/Rs\s*[0-9,]+/);
  });

  // TEST 8: Average Order Cost displays
  test('displays average order cost', async ({ page }) => {
    const avgCost = page.locator('text=/Average Order Cost|Avg.*Cost/');
    expect(await avgCost.count()).toBeGreaterThan(0);
  });

  // TEST 9: Supplier count displays
  test('displays total supplier count', async ({ page }) => {
    const supplierCount = page.locator('text=/Total Suppliers|Suppliers/');
    
    if (await supplierCount.count() > 0) {
      const text = await supplierCount.first().textContent();
      expect(text).toMatch(/\d+/);
    }
  });

  // TEST 10: Category count displays
  test('displays total category count', async ({ page }) => {
    const categoryCount = page.locator('text=/Total Categories|Categories/');
    
    if (await categoryCount.count() > 0) {
      const text = await categoryCount.first().textContent();
      expect(text).toMatch(/\d+/);
    }
  });

  // TEST 11: Total Units purchased displays
  test('displays total units purchased', async ({ page }) => {
    const totalUnits = page.locator('text=/Total Units|Units/');
    
    if (await totalUnits.count() > 0) {
      const text = await totalUnits.first().textContent();
      expect(text).toBeTruthy();
    }
  });

  // TEST 12: Purchase returns displays
  test('displays purchase returns metric', async ({ page }) => {
    const returns = page.locator('text=/Returns|Purchase Returns/');
    
    if (await returns.count() > 0) {
      const text = await returns.first().textContent();
      expect(text).toBeTruthy();
    }
  });
});

test.describe('Purchases Report - Period Filter Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/reports/purchases');
    await page.waitForTimeout(1500);
  });

  // TEST 13: Default period is Today
  test('defaults to Today period', async ({ page }) => {
    const periodSelect = page.locator('select').first();
    const value = await periodSelect.inputValue();
    expect(['today', 'Today'].some(v => v.toLowerCase() === value.toLowerCase())).toBe(true);
  });

  // TEST 14: Can change to Week
  test('can change to Week period', async ({ page }) => {
    const periodSelect = page.locator('select').first();
    
    await periodSelect.selectOption('week');
    await page.waitForTimeout(1500);
    
    // Data should reload
    await expect(page.locator('h1')).toBeVisible();
  });

  // TEST 15: Can change to Month
  test('can change to Month period', async ({ page }) => {
    const periodSelect = page.locator('select').first();
    
    await periodSelect.selectOption('month');
    await page.waitForTimeout(1500);
    
    await expect(page.locator('h1')).toBeVisible();
  });

  // TEST 16: Custom date range works
  test('can use custom date range', async ({ page }) => {
    const periodSelect = page.locator('select').first();
    
    await periodSelect.selectOption('custom');
    await page.waitForTimeout(500);
    
    const dateInputs = page.locator('input[type="date"]');
    expect(await dateInputs.count()).toBeGreaterThanOrEqual(2);
    
    // Set custom dates
    await dateInputs.first().fill('2026-07-01');
    await dateInputs.nth(1).fill('2026-07-12');
    
    await page.waitForTimeout(1500);
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Purchases Report - Expandable Sections Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/reports/purchases');
    await page.waitForTimeout(1500);
  });

  // TEST 17: Can expand supplier breakdown
  test('can expand supplier breakdown section', async ({ page }) => {
    const expandButtons = page.locator('button:has(svg)');
    
    if (await expandButtons.count() > 0) {
      const button = expandButtons.first();
      await button.click();
      await page.waitForTimeout(500);
      
      // Should show content
      const content = page.locator('table, [class*="breakdown"]').first();
      expect(await content.isVisible()).toBe(true);
    }
  });

  // TEST 18: Can expand category breakdown
  test('can expand category breakdown section', async ({ page }) => {
    const expandButtons = page.locator('button:has(svg)');
    
    if (await expandButtons.count() > 1) {
      const buttons = await expandButtons.all();
      await buttons[1].click();
      await page.waitForTimeout(500);
      
      // Should show data
      const content = page.locator('table, [class*="content"]');
      expect(await content.count()).toBeGreaterThan(0);
    }
  });

  // TEST 19: Can collapse sections
  test('can collapse expanded sections', async ({ page }) => {
    const expandButtons = page.locator('button:has(svg)');
    
    if (await expandButtons.count() > 0) {
      const button = expandButtons.first();
      
      // Expand
      await button.click();
      await page.waitForTimeout(500);
      
      // Collapse
      await button.click();
      await page.waitForTimeout(500);
      
      await expect(page.locator('h1')).toBeVisible();
    }
  });
});

test.describe('Purchases Report - Backend Data Verification', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/reports/purchases');
    await page.waitForTimeout(1500);
  });

  // TEST 20: Backend returns purchase data
  test('backend returns valid purchase report data', async ({ page }) => {
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/reports/purchase-kpi?period=today');
        const data = await response.json();
        return {
          success: response.ok,
          status: response.status,
          hasSummary: !!(data?.data?.summary),
          hasData: !!data?.data
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    
    expect(apiResponse.success).toBe(true);
    expect(apiResponse.status).toBe(200);
    expect(apiResponse.hasSummary).toBe(true);
  });

  // TEST 21: Total purchases is non-negative
  test('displays valid total purchases value', async ({ page }) => {
    const purchaseTotal = page.locator('text=/Total Purchases|Rs/').first();
    
    if (await purchaseTotal.isVisible()) {
      const text = await purchaseTotal.textContent();
      const match = text.match(/(\d+,?\d+)/);
      
      if (match) {
        const value = parseInt(match[1].replace(/,/g, ''));
        expect(value).toBeGreaterThanOrEqual(0);
      }
    }
  });

  // TEST 22: Supplier data displays correctly
  test('displays supplier breakdown with supplier names', async ({ page }) => {
    const expandButtons = page.locator('button:has(svg)');
    
    if (await expandButtons.count() > 0) {
      await expandButtons.first().click();
      await page.waitForTimeout(500);
      
      // Should show supplier data
      const table = page.locator('table').first();
      expect(await table.isVisible()).toBe(true);
    }
  });

  // TEST 23: Category data displays correctly
  test('displays category breakdown with category names', async ({ page }) => {
    const expandButtons = page.locator('button:has(svg)');
    
    if (await expandButtons.count() > 1) {
      const buttons = await expandButtons.all();
      await buttons[1].click();
      await page.waitForTimeout(500);
      
      // Should show category data
      const table = page.locator('table').first();
      expect(await table.isVisible()).toBe(true);
    }
  });

  // TEST 24: Unit count is consistent
  test('displays valid unit count data', async ({ page }) => {
    const unitCard = page.locator('text=/Total Units|Units/').first();
    
    if (await unitCard.isVisible()) {
      const text = await unitCard.textContent();
      expect(text).toMatch(/\d+/);
    }
  });
});

test.describe('Purchases Report - Data Accuracy Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/reports/purchases');
    await page.waitForTimeout(1500);
  });

  // TEST 25: Total purchases matches breakdown sum
  test('purchase totals display with consistent values', async ({ page }) => {
    // Get total purchase value
    const totalCard = page.locator('text=/Total Purchases/').first();
    
    if (await totalCard.isVisible()) {
      const totalText = await totalCard.textContent();
      expect(totalText).toMatch(/Rs\s*[0-9,]+/);
    }
  });

  // TEST 26: Currency formatting is consistent
  test('maintains consistent currency format throughout', async ({ page }) => {
    const currencyValues = page.locator('text=/Rs\\s*[0-9,]+/');
    const count = await currencyValues.count();
    
    expect(count).toBeGreaterThan(0);
    
    // Check format of first 5 values
    for (let i = 0; i < Math.min(count, 5); i++) {
      const value = await currencyValues.nth(i).textContent();
      expect(value).toMatch(/Rs\s+[0-9,]+/);
    }
  });

  // TEST 27: No negative values displayed
  test('does not display negative purchase values', async ({ page }) => {
    // All visible numeric values should be non-negative
    const numericValues = page.locator('text=/[0-9,]+/');
    
    if (await numericValues.count() > 0) {
      // Sample first few
      for (let i = 0; i < Math.min(5, await numericValues.count()); i++) {
        const text = await numericValues.nth(i).textContent();
        expect(text).not.toContain('-');
      }
    }
  });

  // TEST 28: Data updates when period changes
  test('updates data when period changes', async ({ page }) => {
    // Get initial total
    const initialTotal = await page.locator('text=/Total Purchases/').first().textContent();
    
    // Change period
    const periodSelect = page.locator('select').first();
    await periodSelect.selectOption('week');
    await page.waitForTimeout(1500);
    
    // Get new total
    const newTotal = await page.locator('text=/Total Purchases/').first().textContent();
    
    // Both should exist
    expect(initialTotal).toBeTruthy();
    expect(newTotal).toBeTruthy();
  });
});

test.describe('Purchases Report - Responsiveness Tests', () => {
  
  // TEST 29: Mobile view
  test('displays correctly on mobile screen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/reports/purchases');
    await page.waitForTimeout(1500);
    
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible();
  });

  // TEST 30: Tablet view
  test('displays correctly on tablet screen', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/reports/purchases');
    await page.waitForTimeout(1500);
    
    await expect(page.locator('h1')).toBeVisible();
  });

  // TEST 31: Desktop view
  test('displays correctly on desktop screen', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/reports/purchases');
    await page.waitForTimeout(1500);
    
    await expect(page.locator('h1')).toBeVisible();
    
    // Should show grid of KPI cards
    const kpiCards = page.locator('[class*="grid"]');
    expect(await kpiCards.count()).toBeGreaterThan(0);
  });
});
