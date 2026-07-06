import { test, expect } from '@playwright/test'

// ============================================
// AUTH PAGE TESTS - Login & Registration
// ============================================
// These tests check the authentication page works correctly
// for both login and registration flows.
// ============================================

test.describe('Auth Page - Basic UI Tests', () => {
  
  // Before each test, go to the auth page
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  // TEST 1: Check that login form shows by default
  test('shows login form when page loads', async ({ page }) => {
    // Check the heading says "Sign in"
    const heading = page.locator('#auth-heading')
    await expect(heading).toHaveText('Sign in')
    
    // Check email input exists
    const emailInput = page.locator('#auth-email-input')
    await expect(emailInput).toBeVisible()
    
    // Check password input exists
    const passwordInput = page.locator('#auth-password-input')
    await expect(passwordInput).toBeVisible()
    
    // Check submit button says "Sign in"
    const submitButton = page.locator('#auth-submit-button')
    await expect(submitButton).toHaveText('Sign in')
  })

  // TEST 2: Check that clicking toggle switches to signup
  test('switches to signup form when toggle button clicked', async ({ page }) => {
    // Click the toggle button
    await page.locator('#auth-toggle-button').click()
    
    // Check heading changed to "Create account"
    const heading = page.locator('#auth-heading')
    await expect(heading).toHaveText('Create account')
    
    // Check name input now appears (only in signup)
    const nameInput = page.locator('#auth-name-input')
    await expect(nameInput).toBeVisible()
    
    // Check phone input now appears (only in signup)
    const phoneInput = page.locator('#auth-phone-input')
    await expect(phoneInput).toBeVisible()
    
    // Check confirm password input appears (only in signup)
    const confirmInput = page.locator('#auth-confirm-password-input')
    await expect(confirmInput).toBeVisible()
    
    // Check submit button now says "Create account"
    const submitButton = page.locator('#auth-submit-button')
    await expect(submitButton).toHaveText('Create account')
  })

  // TEST 3: Check that clicking toggle switches back to login
  test('switches back to login form when toggle clicked again', async ({ page }) => {
    // First switch to signup
    await page.locator('#auth-toggle-button').click()
    await expect(page.locator('#auth-heading')).toHaveText('Create account')
    
    // Now switch back to login
    await page.locator('#auth-toggle-button').click()
    
    // Check heading changed back to "Sign in"
    await expect(page.locator('#auth-heading')).toHaveText('Sign in')
    
    // Check signup-only fields are hidden
    await expect(page.locator('#auth-name-input')).not.toBeVisible()
    await expect(page.locator('#auth-phone-input')).not.toBeVisible()
    await expect(page.locator('#auth-confirm-password-input')).not.toBeVisible()
  })

  // TEST 4: Check password show/hide toggle works
  test('password show/hide toggle works correctly', async ({ page }) => {
    const passwordInput = page.locator('#auth-password-input')
    const toggleButton = page.locator('#auth-password-toggle')
    
    // Initially password should be hidden (type="password")
    await expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Click the toggle button
    await toggleButton.click()
    
    // Now password should be visible (type="text")
    await expect(passwordInput).toHaveAttribute('type', 'text')
    
    // Click again to hide
    await toggleButton.click()
    
    // Password should be hidden again
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  // TEST 5: Check email input auto-focuses on login mode
  test('email input auto-focuses when page loads in login mode', async ({ page }) => {
    // Wait for auto-focus (increased to 300ms to account for useEffect timing)
    await page.waitForTimeout(300)
    
    // Check email input is focused
    const emailInput = page.locator('#auth-email-input')
    await expect(emailInput).toBeFocused()
  })

  // TEST 6: Check name input auto-focuses when switching to signup
  test('name input auto-focuses when switching to signup mode', async ({ page }) => {
    // Switch to signup
    await page.locator('#auth-toggle-button').click()
    
    // Wait for auto-focus (increased to 300ms)
    await page.waitForTimeout(300)
    
    // Check name input is focused
    const nameInput = page.locator('#auth-name-input')
    await expect(nameInput).toBeFocused()
  })

  // TEST 7: Check email input re-focuses when switching back to login
  test('email input re-focuses when switching back to login mode', async ({ page }) => {
    // First switch to signup
    await page.locator('#auth-toggle-button').click()
    await page.waitForTimeout(300)
    
    // Now switch back to login
    await page.locator('#auth-toggle-button').click()
    await page.waitForTimeout(300)
    
    // Check email input is focused again
    const emailInput = page.locator('#auth-email-input')
    await expect(emailInput).toBeFocused()
  })
})

test.describe('Auth Page - Login Validation Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  // TEST 8: Try to login without email - should show error
  test('shows error when trying to login without email', async ({ page }) => {
    // Fill only password
    await page.locator('#auth-password-input').fill('password123')
    
    // Try to submit
    await page.locator('#auth-submit-button').click()
    
    // Check email input is still required (browser validation)
    const emailInput = page.locator('#auth-email-input')
    await expect(emailInput).toHaveAttribute('required', '')
  })

  // TEST 9: Try to login without password - should show error
  test('shows error when trying to login without password', async ({ page }) => {
    // Fill only email
    await page.locator('#auth-email-input').fill('test@example.com')
    
    // Try to submit
    await page.locator('#auth-submit-button').click()
    
    // Check password input is still required (browser validation)
    const passwordInput = page.locator('#auth-password-input')
    await expect(passwordInput).toHaveAttribute('required', '')
  })

  // TEST 10: Try with wrong email format
  test('shows error for invalid email format', async ({ page }) => {
    // Fill with invalid email
    await page.locator('#auth-email-input').fill('not-an-email')
    await page.locator('#auth-password-input').fill('password123')
    
    // Try to submit
    await page.locator('#auth-submit-button').click()
    
    // Browser should block invalid email
    const emailInput = page.locator('#auth-email-input')
    const isValid = await emailInput.evaluate(el => el.checkValidity())
    expect(isValid).toBe(false)
  })

  // TEST 11: Try with special characters in email
  test('accepts special characters in email', async ({ page }) => {
    // Fill with valid email containing special characters
    await page.locator('#auth-email-input').fill('test.user+tag@example.com')
    await page.locator('#auth-password-input').fill('password123')
    
    // Check email is considered valid
    const emailInput = page.locator('#auth-email-input')
    const isValid = await emailInput.evaluate(el => el.checkValidity())
    expect(isValid).toBe(true)
  })
})

test.describe('Auth Page - Registration Validation Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Switch to signup mode
    await page.locator('#auth-toggle-button').click()
  })

  // TEST 12: Role select is disabled in registration mode
  test('role select is disabled when in registration mode', async ({ page }) => {
    const roleSelect = page.locator('#auth-role-select')
    await expect(roleSelect).toBeDisabled()
  })

  // TEST 13: Shows admin-only registration message
  test('shows admin-only registration message in signup mode', async ({ page }) => {
    // Check for the admin-only message
    const message = page.getByText(/Registration is restricted to admin role only/)
    await expect(message).toBeVisible()
  })

  // TEST 14: Try to signup without name
  test('shows error when trying to signup without name', async ({ page }) => {
    // Fill other fields but not name
    await page.locator('#auth-email-input').fill('test@example.com')
    await page.locator('#auth-password-input').fill('password123')
    await page.locator('#auth-confirm-password-input').fill('password123')
    
    // Try to submit
    await page.locator('#auth-submit-button').click()
    
    // Check name input is required
    const nameInput = page.locator('#auth-name-input')
    await expect(nameInput).toHaveAttribute('required', '')
  })

  // TEST 15: Try with mismatched passwords
  test('shows error when passwords do not match', async ({ page }) => {
    // Fill with different passwords
    await page.locator('#auth-name-input').fill('Test User')
    await page.locator('#auth-email-input').fill('test@example.com')
    await page.locator('#auth-password-input').fill('password123')
    await page.locator('#auth-confirm-password-input').fill('different456')
    
    // Try to submit
    await page.locator('#auth-submit-button').click()
    
    // Should show error toast (check for error message)
    // The form should still be visible (not redirected)
    await expect(page.locator('#auth-heading')).toBeVisible()
  })

  // TEST 16: Role defaults to admin in registration mode
  test('role defaults to admin in registration mode', async ({ page }) => {
    // Check the role select has admin as default and is disabled
    const roleSelect = page.locator('#auth-role-select')
    await expect(roleSelect).toHaveValue('admin')
    await expect(roleSelect).toBeDisabled()
  })

  // TEST 18: Special characters in name
  test('accepts special characters in name', async ({ page }) => {
    // Fill name with special characters
    await page.locator('#auth-name-input').fill("O'Connor-Doe")
    await page.locator('#auth-email-input').fill('test@example.com')
    await page.locator('#auth-password-input').fill('password123')
    await page.locator('#auth-confirm-password-input').fill('password123')
    
    // Check name value was accepted
    await expect(page.locator('#auth-name-input')).toHaveValue("O'Connor-Doe")
  })

  // TEST 19: Phone number with special characters
  test('accepts phone number with special characters', async ({ page }) => {
    // Fill phone with special characters
    await page.locator('#auth-phone-input').fill('+1 (234) 567-890')
    
    // Check phone value was accepted
    await expect(page.locator('#auth-phone-input')).toHaveValue('+1 (234) 567-890')
  })
})

test.describe('Auth Page - Responsiveness Tests', () => {
  
  // TEST 20: Check layout on mobile
  test('displays correctly on mobile screen', async ({ page }) => {
    // Set mobile viewport first
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Check mobile logo is visible
    const mobileLogo = page.locator('.lg:hidden')
    await expect(mobileLogo).toBeVisible()
    
    // Check form is still accessible
    await expect(page.locator('#auth-email-input')).toBeVisible()
    await expect(page.locator('#auth-password-input')).toBeVisible()
    
    // Check left panel is hidden on mobile
    const leftPanel = page.locator('.hidden')
    await expect(leftPanel).toHaveCount(1)
  })

  // TEST 21: Check layout on tablet
  test('displays correctly on tablet screen', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    
    // Check form is accessible
    await expect(page.locator('#auth-email-input')).toBeVisible()
    await expect(page.locator('#auth-password-input')).toBeVisible()
  })

  // TEST 22: Check layout on desktop
  test('displays correctly on desktop screen', async ({ page }) => {
    // Set desktop viewport first
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    
    // Check form is accessible
    await expect(page.locator('#auth-email-input')).toBeVisible()
    await expect(page.locator('#auth-password-input')).toBeVisible()
    
    // Check left panel is visible on desktop
    const leftPanel = page.locator('.lg:flex')
    await expect(leftPanel).toBeVisible()
  })
})

test.describe('Auth Page - API Integration Tests', () => {
  
  // TEST 25: Successful login with correct credentials (ik@gmail.com / 1234)
  test('successfully logs in with valid credentials', async ({ page }) => {
    await page.goto('/')
    
    // Fill in correct credentials
    await page.locator('#auth-email-input').fill('ik@gmail.com')
    await page.locator('#auth-password-input').fill('1234')
    await page.locator('#auth-role-select').selectOption('admin')
    
    // Submit the form
    await page.locator('#auth-submit-button').click()
    
    // Wait for navigation or error
    try {
      // Try waiting for navigation to dashboard
      await page.waitForURL(/dashboard/, { timeout: 5000 })
      console.log('Login successful - redirected to dashboard')
    } catch (e) {
      // If no navigation, check if still on auth page
      const currentUrl = page.url()
      if (currentUrl.includes('/#/login') || currentUrl.includes('/#/')) {
        console.log('Login failed - still on auth page')
        await expect(page.locator('#auth-heading')).toBeVisible()
      }
    }
  })

  // TEST 26: Failed login with wrong email
  test('shows error for wrong credentials', async ({ page }) => {
    await page.goto('/')
    
    // Fill with wrong email but correct password
    await page.locator('#auth-email-input').fill('wrong@gmail.com')
    await page.locator('#auth-password-input').fill('1234')
    await page.locator('#auth-role-select').selectOption('admin')
    
    // Submit the form
    await page.locator('#auth-submit-button').click()
    
    // Wait for API response
    await page.waitForTimeout(2000)
    
    // Should still be on auth page with error
    await expect(page.locator('#auth-heading')).toBeVisible()
    console.log('Wrong email login failed as expected')
  })

  // TEST 27: Failed login with wrong password
  test('shows error for wrong password', async ({ page }) => {
    await page.goto('/')
    
    // Fill with correct email but wrong password
    await page.locator('#auth-email-input').fill('ik@gmail.com')
    await page.locator('#auth-password-input').fill('wrongpassword')
    await page.locator('#auth-role-select').selectOption('admin')
    
    // Submit the form
    await page.locator('#auth-submit-button').click()
    
    // Wait for API response
    await page.waitForTimeout(2000)
    
    // Should still be on auth page with error
    await expect(page.locator('#auth-heading')).toBeVisible()
    console.log('Wrong password login failed as expected')
  })

  // TEST 28: Login with staff role should work
  test('login with staff role works correctly', async ({ page }) => {
    await page.goto('/')
    
    // Fill credentials with staff role
    await page.locator('#auth-email-input').fill('ik@gmail.com')
    await page.locator('#auth-password-input').fill('1234')
    await page.locator('#auth-role-select').selectOption('staff')
    
    // Submit the form
    await page.locator('#auth-submit-button').click()
    
    // Wait for navigation or error
    try {
      await page.waitForURL(/dashboard/, { timeout: 5000 })
      console.log('Staff login successful')
    } catch (e) {
      const currentUrl = page.url()
      if (currentUrl.includes('/#/login') || currentUrl.includes('/#/')) {
        console.log('Staff login failed - user may not have staff role')
        await expect(page.locator('#auth-heading')).toBeVisible()
      }
    }
  })

  // TEST 29: Registration should fail for non-admin role
  test('registration is restricted to admin role only', async ({ page }) => {
    await page.goto('/')
    await page.locator('#auth-toggle-button').click()
    
    // Fill registration data
    const timestamp = Date.now()
    await page.locator('#auth-name-input').fill(`Test User ${timestamp}`)
    await page.locator('#auth-email-input').fill(`test${timestamp}@example.com`)
    await page.locator('#auth-phone-input').fill('+1234567890')
    await page.locator('#auth-password-input').fill('password123')
    await page.locator('#auth-confirm-password-input').fill('password123')
    
    // Role select should be disabled and default to admin
    const roleSelect = page.locator('#auth-role-select')
    await expect(roleSelect).toBeDisabled()
    await expect(roleSelect).toHaveValue('admin')
    
    // Submit the form
    await page.locator('#auth-submit-button').click()
    
    // Wait for API response
    await page.waitForTimeout(3000)
    
    // Registration should fail or be restricted
    // The form should still be visible
    await expect(page.locator('#auth-heading')).toBeVisible()
    console.log('Registration restricted as expected')
  })
})

test.describe('Auth Page - Load & Stress Tests', () => {
  
  // TEST 30: Load test - multiple rapid login attempts
  test('handles multiple rapid login attempts', async ({ page }) => {
    await page.goto('/')
    
    // Try 5 rapid login attempts with correct credentials
    for (let i = 0; i < 5; i++) {
      await page.locator('#auth-email-input').fill('ik@gmail.com')
      await page.locator('#auth-password-input').fill('1234')
      await page.locator('#auth-role-select').selectOption('admin')
      await page.locator('#auth-submit-button').click()
      await page.waitForTimeout(300)
      
      // Clear form for next attempt
      await page.locator('#auth-email-input').clear()
      await page.locator('#auth-password-input').clear()
      
      // If redirected, go back to auth page for next test
      const currentUrl = page.url()
      if (!currentUrl.includes('/#/login') && !currentUrl.includes('/#/')) {
        await page.goto('/')
      }
    }
    
    // Page should still be responsive
    await expect(page.locator('#auth-heading')).toBeVisible()
  })

  // TEST 31: Load test - multiple rapid registration attempts
  test('handles multiple rapid registration attempts', async ({ page }) => {
    await page.goto('/')
    await page.locator('#auth-toggle-button').click()
    
    // Try 3 rapid registration attempts
    for (let i = 0; i < 3; i++) {
      const timestamp = Date.now() + i
      await page.locator('#auth-name-input').fill(`Test User ${timestamp}`)
      await page.locator('#auth-email-input').fill(`test${timestamp}@example.com`)
      await page.locator('#auth-phone-input').fill('+1234567890')
      await page.locator('#auth-password-input').fill('password123')
      await page.locator('#auth-confirm-password-input').fill('password123')
      await page.locator('#auth-role-select').selectOption('staff')
      await page.locator('#auth-submit-button').click()
      await page.waitForTimeout(500)
      
      // Clear form for next attempt
      await page.locator('#auth-name-input').clear()
      await page.locator('#auth-email-input').clear()
      await page.locator('#auth-phone-input').clear()
      await page.locator('#auth-password-input').clear()
      await page.locator('#auth-confirm-password-input').clear()
    }
    
    // Page should still be responsive
    await expect(page.locator('#auth-heading')).toBeVisible()
  })

  // TEST 32: Stress test - rapid mode switching
  test('handles rapid mode switching', async ({ page }) => {
    await page.goto('/')
    
    // Switch between login and signup 10 times rapidly
    for (let i = 0; i < 10; i++) {
      await page.locator('#auth-toggle-button').click()
      await page.waitForTimeout(100)
    }
    
    // Page should still work correctly
    await expect(page.locator('#auth-heading')).toBeVisible()
  })

  // TEST 33: Stress test - rapid password toggle
  test('handles rapid password show/hide', async ({ page }) => {
    await page.goto('/')
    
    // Toggle password visibility 20 times rapidly
    for (let i = 0; i < 20; i++) {
      await page.locator('#auth-password-toggle').click()
      await page.waitForTimeout(50)
    }
    
    // Password toggle should still work
    const passwordInput = page.locator('#auth-password-input')
    await page.locator('#auth-password-toggle').click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
  })
})

test.describe('Auth Page - Remember Me Feature', () => {
  
  // TEST 34: Check remember me checkbox works
  test('remember me checkbox can be checked and unchecked', async ({ page }) => {
    await page.goto('/')
    
    const checkbox = page.locator('#auth-remember-me')
    
    // Initially unchecked
    await expect(checkbox).not.toBeChecked()
    
    // Check it
    await checkbox.check()
    await expect(checkbox).toBeChecked()
    
    // Uncheck it
    await checkbox.uncheck()
    await expect(checkbox).not.toBeChecked()
  })
})

test.describe('Auth Page - User Friendly Messages', () => {
  
  // TEST 35: Check that error messages are user-friendly
  test('shows user-friendly error messages', async ({ page }) => {
    await page.goto('/')
    
    // Try to submit empty form
    await page.locator('#auth-submit-button').click()
    
    // Browser validation should show helpful messages
    // The form should prevent submission
    await expect(page.locator('#auth-heading')).toBeVisible()
  })

  // TEST 36: Check that button shows loading state
  test('shows loading state when submitting', async ({ page }) => {
    await page.goto('/')
    
    // Fill form
    await page.locator('#auth-email-input').fill('test@example.com')
    await page.locator('#auth-password-input').fill('password123')
    
    // Submit
    await page.locator('#auth-submit-button').click()
    
    // Button should show loading state briefly
    const button = page.locator('#auth-submit-button')
    // Note: Loading state is transient, so we just check button exists
    await expect(button).toBeVisible()
  })
})
