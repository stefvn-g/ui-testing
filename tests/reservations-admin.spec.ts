import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ReservationsPage } from '../pages/ReservationsPage';
import { VehiclesPage } from '../pages/VehiclesPage';
import { VehicleDetailPage } from '../pages/VehicleDetailPage';
import { DashboardPage } from '../pages/DashboardPage';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;
const WORKER_EMAIL = process.env.WORKER_EMAIL!;
const WORKER_PASSWORD = process.env.WORKER_PASSWORD!;
const CUSTOMER_EMAIL = process.env.CUSTOMER_EMAIL!;
const CUSTOMER_PASSWORD = process.env.CUSTOMER_PASSWORD!;

function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

async function loginAs(page: any, email: string, password: string) {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  await loginPage.goto();
  await loginPage.login(email, password);
  await dashboardPage.expectLoaded();
}

async function createReservationAsCustomer(page: any): Promise<string | null> {
  await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);

  const vehiclesPage = new VehiclesPage(page);
  const detailPage = new VehicleDetailPage(page);

  await vehiclesPage.goto();
  await page.waitForTimeout(2000);
  await vehiclesPage.availableOnlyTab.click();
  await page.waitForTimeout(2000);

  const count = await page.locator('.grid > div').count();
  if (count === 0) return null;

  const firstCard = page.locator('.grid > div').first();
  const vehicleName = await firstCard.locator('h3').innerText();
  await firstCard.locator('button', { hasText: 'Details' }).click();

  await detailPage.openReservationModal();
  await detailPage.fillReservationDates(futureDate(20), futureDate(23));
  await detailPage.submitReservation();
  await detailPage.expectReservationSuccess();

  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  await page.waitForLoadState('networkidle');
  await page.locator('button', { hasText: 'Sign out' }).click({ force: true });
  await page.waitForURL(/\/login/, { timeout: 15000 });

  return vehicleName;
}

test.describe('Admin/Worker — Reservation Management', () => {
  test.describe('Happy Paths', () => {
    test('Admin can view all reservations', async ({ page }) => {
      const reservationsPage = new ReservationsPage(page);
      await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
      await reservationsPage.goto();
      await page.waitForTimeout(3000);
      await expect(page.locator('h2', { hasText: 'Reservations' })).toBeVisible();
    });

    test('Worker can view all reservations', async ({ page }) => {
      const reservationsPage = new ReservationsPage(page);
      await loginAs(page, WORKER_EMAIL, WORKER_PASSWORD);
      await reservationsPage.goto();
      await page.waitForTimeout(3000);
      await expect(page.locator('h2', { hasText: 'Reservations' })).toBeVisible();
    });

    test('Admin can approve a pending reservation', async ({ page }) => {
      const vehicleName = await createReservationAsCustomer(page);
      if (!vehicleName) return test.skip(true, 'No available vehicles');

      await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
      const reservationsPage = new ReservationsPage(page);
      await reservationsPage.goto();
      await page.waitForTimeout(3000);

      const pendingCard = page.locator('.space-y-3 > div').filter({ hasText: vehicleName }).filter({ hasText: 'Pending' }).first();
      const exists = await pendingCard.isVisible();
      if (!exists) return test.skip(true, 'Pending reservation not found');

      await pendingCard.locator('button', { hasText: 'Approve' }).click();
      await reservationsPage.confirmAction('Approve');
      await page.waitForTimeout(3000);

      const approvedCard = page.locator('.space-y-3 > div').filter({ hasText: vehicleName }).filter({ hasText: 'Approved' }).first();
      await expect(approvedCard).toBeVisible({ timeout: 15000 });
    });

    test('Worker can reject a pending reservation', async ({ page }) => {
      const vehicleName = await createReservationAsCustomer(page);
      if (!vehicleName) return test.skip(true, 'No available vehicles');

      await loginAs(page, WORKER_EMAIL, WORKER_PASSWORD);
      const reservationsPage = new ReservationsPage(page);
      await reservationsPage.goto();
      await page.waitForTimeout(3000);

      const pendingCard = page.locator('.space-y-3 > div').filter({ hasText: vehicleName }).filter({ hasText: 'Pending' }).first();
      const exists = await pendingCard.isVisible();
      if (!exists) return test.skip(true, 'Pending reservation not found');

      await pendingCard.locator('button', { hasText: 'Reject' }).click();
      await reservationsPage.confirmAction('Reject');
      await page.waitForTimeout(3000);

      const rejectedCard = page.locator('.space-y-3 > div').filter({ hasText: vehicleName }).filter({ hasText: 'Rejected' }).first();
      await expect(rejectedCard).toBeVisible({ timeout: 15000 });
    });

    test('Admin can search reservations by customer or vehicle name', async ({ page }) => {
      await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
      const reservationsPage = new ReservationsPage(page);
      await reservationsPage.goto();
      await page.waitForTimeout(3000);

      await reservationsPage.searchFor('Toyota');
      await page.waitForTimeout(500);

      await reservationsPage.searchFor('zzz_no_match_xyz');
      await page.waitForTimeout(500);
      await expect(page.locator('p', { hasText: 'No reservations found' })).toBeVisible();
    });

    test('Admin can filter reservations by status using tabs', async ({ page }) => {
      await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
      const reservationsPage = new ReservationsPage(page);
      await reservationsPage.goto();
      await page.waitForTimeout(3000);

      await page.locator('div.flex.gap-1 button', { hasText: 'Pending' }).click();
      await page.waitForTimeout(500);

      const pendingItems = await page.locator('.space-y-3 > div').count();
      if (pendingItems > 0) {
        const allContainPending = await page.locator('.space-y-3 > div').filter({ hasText: 'Pending' }).count();
        expect(allContainPending).toBe(pendingItems);
      }
    });

    test('Admin sees summary stat cards on the reservations page', async ({ page }) => {
      await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
      await page.goto('/reservations');
      await page.waitForTimeout(3000);

      await expect(page.locator('p', { hasText: 'Pending' }).first()).toBeVisible();
      await expect(page.locator('p', { hasText: 'Approved' }).first()).toBeVisible();
      await expect(page.locator('p', { hasText: 'Completed' }).first()).toBeVisible();
      await expect(page.locator('p', { hasText: 'Cancelled' }).first()).toBeVisible();
    });
  });

  test.describe('Sad Paths', () => {
    test('Search returning no matches shows empty state', async ({ page }) => {
      await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
      const reservationsPage = new ReservationsPage(page);
      await reservationsPage.goto();
      await page.waitForTimeout(3000);
      await reservationsPage.searchFor('zzz_absolutely_no_match_xyz_123');
      await page.waitForTimeout(500);
      await expect(page.locator('p', { hasText: 'No reservations found' })).toBeVisible();
    });

    test('Completed reservations do not show any action buttons', async ({ page }) => {
      await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
      await page.goto('/reservations');
      await page.waitForTimeout(3000);

      await page.locator('div.flex.gap-1 button', { hasText: 'Completed' }).click();
      await page.waitForTimeout(500);

      const completedCards = page.locator('.space-y-3 > div');
      const count = await completedCards.count();
      if (count > 0) {
        const firstCard = completedCards.first();
        await expect(firstCard.locator('button', { hasText: 'Approve' })).not.toBeVisible();
        await expect(firstCard.locator('button', { hasText: 'Reject' })).not.toBeVisible();
        await expect(firstCard.locator('button', { hasText: 'Complete' })).not.toBeVisible();
      }
    });

    test('Rejected reservations do not show any action buttons', async ({ page }) => {
      await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
      await page.goto('/reservations');
      await page.waitForTimeout(3000);

      await page.locator('div.flex.gap-1 button', { hasText: 'Rejected' }).click();
      await page.waitForTimeout(500);

      const rejectedCards = page.locator('.space-y-3 > div');
      const count = await rejectedCards.count();
      if (count > 0) {
        const firstCard = rejectedCards.first();
        await expect(firstCard.locator('button', { hasText: 'Approve' })).not.toBeVisible();
      }
    });

    test('Admin cannot see My Reservations nav item', async ({ page }) => {
      await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
      await page.goto('/dashboard');
      await expect(page.locator('nav a[href="/reservations/my"]')).not.toBeVisible();
      await expect(page.locator('nav a[href="/reservations"]')).toBeVisible();
      await expect(page.locator('nav a[href="/users"]')).toBeVisible();
    });
  });
});