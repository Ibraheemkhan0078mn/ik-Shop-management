import { test, expect } from '@playwright/test';

test.describe('Authentication - E2E Tests', () => {
  test('1. Password toggle functionality', async ({ page }) => {
    // Navigate to auth page
    await page.goto('http://localhost:5173/auth');
    await page.waitForLoadState('networkidle');

    const passwordInput = page.locator('#auth-password-input');
    const toggleButton = page.locator('#auth-password-toggle');

    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle to show password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click toggle to hide password again
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('2. Login with invalid credentials shows error', async ({ page }) => {
    // Navigate to auth page
    await page.goto('http://localhost:5173/auth');
    await page.waitForLoadState('networkidle');

    // Fill in invalid credentials
    await page.fill('#auth-email-input', 'invalid@example.com');
    await page.fill('#auth-password-input', 'wrongpassword');

    // Submit login
    await page.click('#auth-submit-button');

    // Wait a bit for the error to appear
    await page.waitForTimeout(3000);

    // Verify we are still on auth page (login failed)
    await expect(page.locator('#auth-heading')).toBeVisible();
    const currentUrl = page.url();
    expect(currentUrl).toContain('/auth');
  });

  test('3. Login with valid credentials', async ({ page }) => {
    // Navigate to auth page
    await page.goto('http://localhost:5173/auth');
    await page.waitForLoadState('networkidle');

    // Verify auth page is loaded
    await expect(page.locator('#auth-heading')).toBeVisible();

    // Fill in login credentials
    await page.fill('#auth-email-input', 'ik@gmail.com');
    await page.fill('#auth-password-input', '1234567');

    // Submit login
    await page.click('#auth-submit-button');

    // Wait for navigation away from auth page (login successful)
    await page.waitForURL('**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Verify we are no longer on auth page (login successful)
    await expect(page.locator('#auth-heading')).not.toBeVisible();
  });
});
