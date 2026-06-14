import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;
const CUSTOMER_EMAIL = process.env.CUSTOMER_EMAIL!;
const CUSTOMER_PASSWORD = process.env.CUSTOMER_PASSWORD!;

test.describe('Authentication', () => {
  test.describe('Login — Happy Paths', () => {
    test('Admin can log in and reach the dashboard', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);

      await loginPage.goto();
      await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
      await dashboardPage.expectLoaded();
      await dashboardPage.expectRoleBadge('Admin');
    });

    test('Customer can log in and reach the dashboard', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);

      await loginPage.goto();
      await loginPage.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
      await dashboardPage.expectLoaded();
      await dashboardPage.expectRoleBadge('Customer');
    });

    test('Worker can log in and reach the dashboard', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);

      await loginPage.goto();
      await loginPage.login(process.env.WORKER_EMAIL!, process.env.WORKER_PASSWORD!);
      await dashboardPage.expectLoaded();
      await dashboardPage.expectRoleBadge('Worker');
    });

    test('Authenticated user visiting /login is redirected to dashboard', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);

      await loginPage.goto();
      await loginPage.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
      await dashboardPage.expectLoaded();

      await page.waitForLoadState('networkidle');
      await page.goto('/login');
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    });
  });

  test.describe('Login — Sad Paths', () => {
    test('Shows error for wrong password', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(ADMIN_EMAIL, 'WrongPassword123!');
      await loginPage.expectError('Invalid email or password');
    });

    test('Shows error for non-existent email', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('nobody@doesnotexist.com', 'SomePassword123!');
      await loginPage.expectError('Invalid email or password');
    });

    test('Submit button shows loading state during request', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.emailInput.fill(ADMIN_EMAIL);
      await loginPage.passwordInput.fill(ADMIN_PASSWORD);
      await loginPage.submitButton.click();
      await expect(page.locator('button[type="submit"]', { hasText: 'Signing in...' })).toBeVisible();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
    });

    test('Unauthenticated user visiting /dashboard is redirected to /login', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });

    test('Unauthenticated user visiting /vehicles is redirected to /login', async ({ page }) => {
      await page.goto('/vehicles');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Register — Happy Paths', () => {
    test('New user can register and is redirected to dashboard as Customer', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      const dashboardPage = new DashboardPage(page);

      const uniqueEmail = `testuser_${Date.now()}@testmail.com`;

      await registerPage.goto();
      await expect(page.locator('h2', { hasText: 'Create an account' })).toBeVisible();
      await registerPage.register('Test', 'User', uniqueEmail, 'StrongPass1!');
      await dashboardPage.expectLoaded();
      await dashboardPage.expectRoleBadge('Customer');
    });

    test('Register page has a link to login', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      await registerPage.loginLink.click();
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Register — Sad Paths', () => {
    test('Cannot register with an already-existing email', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      await registerPage.register('Test', 'User', CUSTOMER_EMAIL, 'StrongPass1!');
      await registerPage.expectError('already exists');
    });
  });

  test.describe('Logout', () => {
    test('Admin can log out and is redirected to login', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);

      await loginPage.goto();
      await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
      await dashboardPage.expectLoaded();
      await dashboardPage.logout();
      await expect(page).toHaveURL(/\/login/);
    });

    test('After logout, navigating to /dashboard redirects to /login', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);

      await loginPage.goto();
      await loginPage.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
      await dashboardPage.expectLoaded();
      await dashboardPage.logout();
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });
  });
});