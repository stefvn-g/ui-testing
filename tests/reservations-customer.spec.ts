import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { VehiclesPage } from '../pages/VehiclesPage';
import { VehicleDetailPage } from '../pages/VehicleDetailPage';
import { MyReservationsPage } from '../pages/MyReservationsPage';

const CUSTOMER_EMAIL = process.env.CUSTOMER_EMAIL!;
const CUSTOMER_PASSWORD = process.env.CUSTOMER_PASSWORD!;

function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

async function loginAsCustomer(loginPage: LoginPage) {
  await loginPage.goto();
  await loginPage.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
  await loginPage.page.waitForURL(/\/dashboard/);
}

test.describe('Customer — Reservation Workflows', () => {
  test.describe('Happy Paths', () => {
    test('Customer can view My Reservations page', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const myReservationsPage = new MyReservationsPage(page);

      await loginAsCustomer(loginPage);
      await myReservationsPage.goto();
      await expect(page.locator('h2', { hasText: 'My Reservations' })).toBeVisible();
    });

    test('Customer can reserve an available vehicle end-to-end', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const vehiclesPage = new VehiclesPage(page);
      const detailPage = new VehicleDetailPage(page);
      const myReservationsPage = new MyReservationsPage(page);

      await loginAsCustomer(loginPage);
      await vehiclesPage.goto();
      await vehiclesPage.waitForVehicles();

      await vehiclesPage.availableOnlyTab.click();
      await page.waitForTimeout(1500);

      const availableCards = vehiclesPage.vehicleCards;
      const count = await availableCards.count();
      test.skip(count === 0, 'No available vehicles to reserve');

      const firstCard = availableCards.first();
      await firstCard.locator('button', { hasText: 'Details' }).click();
      await expect(page).toHaveURL(/\/vehicles\/\d+/);

      await detailPage.openReservationModal();
      await detailPage.fillReservationDates(futureDate(5), futureDate(8));
      await detailPage.submitReservation();

      await detailPage.expectReservationSuccess();

      await myReservationsPage.goto();
      await page.waitForTimeout(2000);
      const items = myReservationsPage.reservationItems;
      const itemCount = await items.count();
      expect(itemCount).toBeGreaterThan(0);
    });

    test('My Reservations page shows correct reservation information', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const myReservationsPage = new MyReservationsPage(page);

      await loginAsCustomer(loginPage);
      await myReservationsPage.goto();
      await page.waitForTimeout(2000);

      const count = await myReservationsPage.reservationItems.count();
      if (count > 0) {
        const firstItem = myReservationsPage.reservationItems.first();
        await expect(firstItem).toBeVisible();
        const text = await firstItem.innerText();
        expect(text).toMatch(/€[\d.]+/);
      }
    });

    test('Customer can cancel a Pending or Approved reservation', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const vehiclesPage = new VehiclesPage(page);
      const detailPage = new VehicleDetailPage(page);
      const myReservationsPage = new MyReservationsPage(page);

      await loginAsCustomer(loginPage);
      await vehiclesPage.goto();
      await vehiclesPage.waitForVehicles();
      await vehiclesPage.availableOnlyTab.click();
      await page.waitForTimeout(1500);

      const count = await vehiclesPage.vehicleCards.count();
      test.skip(count === 0, 'No available vehicles');

      const firstCard = vehiclesPage.vehicleCards.first();
      const vehicleName = await firstCard.locator('h3').innerText();
      await firstCard.locator('button', { hasText: 'Details' }).click();
      await detailPage.openReservationModal();
      await detailPage.fillReservationDates(futureDate(15), futureDate(17));
      await detailPage.submitReservation();
      await detailPage.expectReservationSuccess();

      await myReservationsPage.goto();
      await page.waitForTimeout(2000);

      const pendingCard = page.locator('.space-y-3 > div').filter({ hasText: vehicleName }).filter({ hasText: 'Pending' }).first();
      const cancelBtn = pendingCard.locator('button', { hasText: 'Cancel' });
      const cancelVisible = await cancelBtn.isVisible();

      if (cancelVisible) {
        await cancelBtn.click();
        const confirmBtn = page.locator('button', { hasText: 'Cancel Reservation' });
        await expect(confirmBtn).toBeVisible();
        await confirmBtn.click();
        await page.waitForTimeout(2000);

        const cancelledCard = page.locator('.space-y-3 > div').filter({ hasText: vehicleName }).filter({ hasText: 'Cancelled' }).first();
        await expect(cancelledCard).toBeVisible({ timeout: 10000 });
      }
    });

    test('New Reservation button navigates to available vehicles', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const myReservationsPage = new MyReservationsPage(page);

      await loginAsCustomer(loginPage);
      await myReservationsPage.goto();
      await myReservationsPage.newReservationButton.click();
      await expect(page).toHaveURL(/\/vehicles/);
    });
  });

  test.describe('Sad Paths', () => {
    test('Cannot submit reservation without selecting dates', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const vehiclesPage = new VehiclesPage(page);
      const detailPage = new VehicleDetailPage(page);

      await loginAsCustomer(loginPage);
      await vehiclesPage.goto();
      await vehiclesPage.waitForVehicles();
      await vehiclesPage.availableOnlyTab.click();
      await page.waitForTimeout(1500);

      const count = await vehiclesPage.vehicleCards.count();
      test.skip(count === 0, 'No available vehicles');

      await vehiclesPage.vehicleCards.first().locator('button', { hasText: 'Details' }).click();
      await detailPage.openReservationModal();

      const confirmBtn = detailPage.confirmReservationButton;
      await expect(confirmBtn).toBeDisabled();
    });

    test('Cannot reserve a vehicle where start date equals end date', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const vehiclesPage = new VehiclesPage(page);
      const detailPage = new VehicleDetailPage(page);

      await loginAsCustomer(loginPage);
      await vehiclesPage.goto();
      await vehiclesPage.waitForVehicles();
      await vehiclesPage.availableOnlyTab.click();
      await page.waitForTimeout(1500);

      const count = await vehiclesPage.vehicleCards.count();
      test.skip(count === 0, 'No available vehicles');

      await vehiclesPage.vehicleCards.first().locator('button', { hasText: 'Details' }).click();
      await detailPage.openReservationModal();

      const sameDay = futureDate(3);
      await detailPage.startDateInput.fill(sameDay);
      await detailPage.endDateInput.fill(sameDay);

      const confirmBtn = detailPage.confirmReservationButton;
      await expect(confirmBtn).toBeDisabled();
    });

    test('Reserve button is hidden for non-available vehicles', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const vehiclesPage = new VehiclesPage(page);
      const detailPage = new VehicleDetailPage(page);

      await loginAsCustomer(loginPage);
      await vehiclesPage.goto();
      await vehiclesPage.waitForVehicles();

      const maintenanceCard = page.locator('.grid > div').filter({ hasText: 'Maintenance' }).first();
      const maintenanceExists = await maintenanceCard.isVisible();

      if (maintenanceExists) {
        await maintenanceCard.locator('button', { hasText: 'Details' }).click();
        await expect(page).toHaveURL(/\/vehicles\/\d+/);
        await expect(detailPage.reserveButton).not.toBeVisible();
      } else {
        test.skip(true, 'No maintenance vehicle in fleet');
      }
    });

    test('Customer sidebar shows My Reservations but not Reservations', async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginAsCustomer(loginPage);
      await page.goto('/dashboard');

      await expect(page.locator('nav a[href="/reservations/my"]')).toBeVisible();
      await expect(page.locator('nav a[href="/reservations"]')).not.toBeVisible();
      await expect(page.locator('nav a[href="/users"]')).not.toBeVisible();
    });
  });
});