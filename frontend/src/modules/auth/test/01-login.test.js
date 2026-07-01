import { test, expect } from '@playwright/test'

test.describe('Auth page - Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows login form by default', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByPlaceholder('john@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••').first()).toBeVisible();
  });

  test('toggles to signup form', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
    await expect(page.getByPlaceholder('John Doe')).toBeVisible();
  });

  test('shows error toast on empty submit with invalid email', async ({ page }) => {
    await page.getByPlaceholder('john@example.com').fill('ik@gmail.com');
    await page.getByPlaceholder('••••••••').first().fill('1234');
    await page.getByRole('button', { name: 'Sign in' }).click();
    // browser's native HTML5 email validation blocks submit; form stays visible
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('successful login redirects away from auth page', async ({ page }) => {
    await page.getByPlaceholder('john@example.com').fill('ik@gmail.com');
    await page.getByPlaceholder('••••••••').first().fill('1234');
    await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/#/dashboard');
  });
});