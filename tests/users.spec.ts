import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { UsersPage } from '../pages/UsersPage';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;
const CUSTOMER_EMAIL = process.env.CUSTOMER_EMAIL!;
const CUSTOMER_PASSWORD = process.env.CUSTOMER_PASSWORD!;
const WORKER_EMAIL = process.env.WORKER_EMAIL!;
const WORKER_PASSWORD = process.env.WORKER_PASSWORD!;

async function loginAsAdmin(loginPage: LoginPage) {
  await loginPage.goto();
  await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
  await loginPage.page.waitForURL(/\/dashboard/);
}

test.describe('Users Management (Admin Only)', () => {
  test.describe('Happy Paths', () => {
    test('Admin can view all users', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const usersPage = new UsersPage(page);

      await loginAsAdmin(loginPage);
      await usersPage.goto();
      await page.waitForTimeout(2000);

      await expect(page.locator('h2', { hasText: 'Users' })).toBeVisible();
      const rows = usersPage.userRows;
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
    });

    test('Admin can search for a user by email', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const usersPage = new UsersPage(page);

      await loginAsAdmin(loginPage);
      await usersPage.goto();
      await page.waitForTimeout(2000);

      await usersPage.searchFor(CUSTOMER_EMAIL);
      await page.waitForTimeout(500);
      await usersPage.expectUserVisible(CUSTOMER_EMAIL);
    });

    test('Admin can filter users by role', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const usersPage = new UsersPage(page);

      await loginAsAdmin(loginPage);
      await usersPage.goto();
      await page.waitForTimeout(2000);

      await page.locator('div.flex.gap-1 button', { hasText: 'Customer' }).click();
      await page.waitForTimeout(500);

      const rows = page.locator('.bg-slate-900.border.border-slate-800.rounded-2xl > div');
      const count = await rows.count();
      if (count > 0) {
        const badges = await page.locator('span.rounded-full').filter({ hasText: /^(Admin|Worker|Customer)$/ }).allInnerTexts();
        const roleBadges = badges.filter(b => ['Admin', 'Worker', 'Customer'].includes(b));
        roleBadges.forEach(b => expect(b).toBe('Customer'));
      }
    });

    test('Admin can edit a user role', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const usersPage = new UsersPage(page);

      await loginAsAdmin(loginPage);
      await usersPage.goto();
      await page.waitForTimeout(2000);

      await usersPage.searchFor(WORKER_EMAIL);
      await page.waitForTimeout(500);

      await usersPage.clickEditForUser(WORKER_EMAIL);

      const currentRole = await usersPage.roleSelect.inputValue();
      const newRole = currentRole === 'Worker' ? 'Customer' : 'Worker';
      await usersPage.updateUserRole(newRole);
      await page.waitForTimeout(2000);

      await usersPage.goto();
      await page.waitForTimeout(2000);
      await usersPage.searchFor(WORKER_EMAIL);
      await page.waitForTimeout(500);

      const rowText = await page.locator('div').filter({ hasText: WORKER_EMAIL }).first().innerText();
      expect(rowText).toContain(newRole);

      await usersPage.clickEditForUser(WORKER_EMAIL);
      await usersPage.updateUserRole('Worker');
      await page.waitForTimeout(2000);
    });

    test('Admin sees their own account marked as "you"', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const usersPage = new UsersPage(page);

      await loginAsAdmin(loginPage);
      await usersPage.goto();
      await page.waitForTimeout(2000);
      await usersPage.searchFor(ADMIN_EMAIL);
      await page.waitForTimeout(500);

      await expect(page.locator('span', { hasText: 'you' })).toBeVisible();
    });

    test('Admin sees summary cards for Admins, Workers, Customers', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginAsAdmin(loginPage);
      await page.goto('/users');
      await page.waitForTimeout(2000);

      await expect(page.locator('p', { hasText: 'Admins' })).toBeVisible();
      await expect(page.locator('p', { hasText: 'Workers' })).toBeVisible();
      await expect(page.locator('p', { hasText: 'Customers' })).toBeVisible();
    });

    test('Admin can delete a user (newly registered test user)', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const usersPage = new UsersPage(page);

      const uniqueEmail = `todelete_${Date.now()}@test.com`;

      await page.goto('/register');
      await page.locator('input[name="firstName"]').fill('Delete');
      await page.locator('input[name="lastName"]').fill('Me');
      await page.locator('input[name="email"]').fill(uniqueEmail);
      await page.locator('input[name="password"]').fill('StrongPass1!');
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(/\/dashboard/);

      await page.locator('button', { hasText: 'Sign out' }).click();
      await page.waitForURL(/\/login/);

      await loginAsAdmin(loginPage);
      await usersPage.goto();
      await page.waitForTimeout(2000);
      await usersPage.searchFor(uniqueEmail);
      await page.waitForTimeout(500);

      await usersPage.expectUserVisible(uniqueEmail);
      await usersPage.clickDeleteForUser(uniqueEmail);
      await usersPage.confirmDelete();
      await page.waitForTimeout(2000);

      await usersPage.goto();
      await page.waitForTimeout(2000);
      await usersPage.searchFor(uniqueEmail);
      await page.waitForTimeout(500);
      await usersPage.expectUserNotVisible(uniqueEmail);
    });
  });

  test.describe('Sad Paths', () => {
    test('Admin cannot delete their own account — Delete button is disabled', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const usersPage = new UsersPage(page);

      await loginAsAdmin(loginPage);
      await usersPage.goto();
      await page.waitForTimeout(2000);
      await usersPage.searchFor(ADMIN_EMAIL);
      await page.waitForTimeout(500);

      const adminRow = page.locator('div').filter({ hasText: ADMIN_EMAIL }).filter({ has: page.locator('button', { hasText: 'Delete' }) }).first();
      const deleteBtn = adminRow.locator('button', { hasText: 'Delete' });
      await expect(deleteBtn).toBeDisabled();
    });

    test('Search returning no results shows empty state', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const usersPage = new UsersPage(page);

      await loginAsAdmin(loginPage);
      await usersPage.goto();
      await page.waitForTimeout(2000);
      await usersPage.searchFor('zzz_no_user_here_xyz_12345');
      await page.waitForTimeout(500);

      await expect(page.locator('p', { hasText: 'No users found' })).toBeVisible();
    });

    test('Customer cannot access /users — redirected to /unauthorized', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
      await page.waitForURL(/\/dashboard/);
      await page.goto('/users');
      await expect(page).toHaveURL(/\/unauthorized/);
    });

    test('Worker cannot access /users — redirected to /unauthorized', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(WORKER_EMAIL, WORKER_PASSWORD);
      await page.waitForURL(/\/dashboard/);
      await page.goto('/users');
      await expect(page).toHaveURL(/\/unauthorized/);
    });
  });
});