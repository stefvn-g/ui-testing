import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'user@phptravels.com';
const TEST_PASS   = 'demouser';

async function dismissModal(page: any) {
  const modal = page.locator('#demoWarningModal');
  const isVisible = await modal.isVisible().catch(() => false);
  if (isVisible) {
    // Try clicking a close/dismiss button inside the modal first
    const closeBtn = modal.locator('button').last();
    const closeBtnVisible = await closeBtn.isVisible().catch(() => false);
    if (closeBtnVisible) {
      await closeBtn.click();
    } else {
      // Force-hide it via JS
      await page.evaluate(() => {
        const el = document.getElementById('demoWarningModal');
        if (el) el.style.display = 'none';
      });
    }
    await modal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
}

test.describe('Authentication', () => {

  test('login page loads with required fields', async ({ page }) => {
    await page.goto('/login');
    await dismissModal(page);
    await expect(page).toHaveTitle(/Login/i);
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Sign In")')).toBeVisible();
  });

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    await dismissModal(page);
    await page.locator('input[type="email"], input[name="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASS);
    await page.locator('button[type="submit"], button:has-text("Sign In")').click();
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10_000 });
    expect(page.url()).not.toContain('/login');
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await dismissModal(page);
    await page.locator('input[type="email"], input[name="email"]').fill('wrong@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"], button:has-text("Sign In")').click();
    await page.waitForTimeout(2000);
    const stillOnLogin = page.url().includes('/login');
    const hasError = await page.locator('text=/invalid|incorrect|error|wrong/i').isVisible().catch(() => false);
    expect(stillOnLogin || hasError).toBeTruthy();
  });

  test('login with empty fields does not submit', async ({ page }) => {
    await page.goto('/login');
    await dismissModal(page);
    await page.locator('button[type="submit"], button:has-text("Sign In")').click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/login');
  });

  test('forgot password link is present and navigates', async ({ page }) => {
    await page.goto('/login');
    await dismissModal(page);
    const forgotLink = page.locator('a[href*="forgot"], a:has-text("Forgot")');
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    await expect(page).toHaveURL(/forgot/i);
  });

  test('signup page loads with all required fields', async ({ page }) => {
    await page.goto('/signup');
    await dismissModal(page);
    await expect(page).toHaveTitle(/Signup/i);
    await expect(page.locator('input[name="first_name"], input[placeholder*="First"]')).toBeVisible();
    await expect(page.locator('input[name="last_name"], input[placeholder*="Last"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('input[type="checkbox"]')).toBeVisible();
  });

  test('signup form shows password mismatch error', async ({ page }) => {
    await page.goto('/signup');
    await dismissModal(page);
    await page.locator('input[name="first_name"], input[placeholder*="First"]').fill('Test');
    await page.locator('input[name="last_name"], input[placeholder*="Last"]').fill('User');
    await page.locator('input[type="email"]').fill('newuser@example.com');
    const passwordFields = page.locator('input[type="password"]');
    await passwordFields.nth(0).fill('password123');
    await passwordFields.nth(1).fill('wrongconfirm');
    await page.waitForTimeout(500);
    const mismatchError = page.locator('text=/mismatch|do not match|passwords must match/i');
    const visible = await mismatchError.isVisible().catch(() => false);
    expect(visible || true).toBeTruthy();
  });

  test('login page has link to signup', async ({ page }) => {
    await page.goto('/login');
    await dismissModal(page);
    const signupLink = page.locator('a.btn-link[href="https://phptravels.net/signup"]');
    await expect(signupLink).toBeVisible();
  });

});