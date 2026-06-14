import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { VehiclesPage } from '../pages/VehiclesPage';
import { VehicleDetailPage } from '../pages/VehicleDetailPage';
import { DashboardPage } from '../pages/DashboardPage';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;
const CUSTOMER_EMAIL = process.env.CUSTOMER_EMAIL!;
const CUSTOMER_PASSWORD = process.env.CUSTOMER_PASSWORD!;

async function loginAs(page: any, email: string, password: string) {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  await loginPage.goto();
  await loginPage.login(email, password);
  await dashboardPage.expectLoaded();
}

test.describe('Vehicles', () => {
  test.describe('Admin — Happy Paths', () => {
    test('Admin sees the Add Vehicle button', async ({ page }) => {
      const vehiclesPage = new VehiclesPage(page);
      await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
      await vehiclesPage.goto();
      await page.waitForTimeout(2000);
      await expect(vehiclesPage.addVehicleButton).toBeVisible();
    });

    test('Admin can add a new vehicle', async ({ page }) => {
      const vehiclesPage = new VehiclesPage(page);
      await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
      await vehiclesPage.goto();
      await page.waitForTimeout(2000);

      const testMake = 'Playwright';
      const testModel = `Auto${Date.now()}`;

      await vehiclesPage.openAddForm();
      await vehiclesPage.fillVehicleForm({
        make: testMake,
        model: testModel,
        year: '2024',
        price: '50',
        category: 'Sedan',
        description: 'Added by Playwright test',
      });
      await vehiclesPage.submitForm();

      await page.waitForTimeout(2000);
      await vehiclesPage.expectVehicleVisible(testMake, testModel);
    });

    test('Admin can edit an existing vehicle', async ({ page }) => {
      const vehiclesPage = new VehiclesPage(page);
      await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
      await vehiclesPage.goto();
      await page.waitForTimeout(2000);

      const make = 'EditTest';
      const model = `Car${Date.now()}`;

      await vehiclesPage.openAddForm();
      await vehiclesPage.fillVehicleForm({
        make,
        model,
        year: '2023',
        price: '40',
        category: 'SUV',
        description: 'Original description',
      });
      await vehiclesPage.submitForm();
      await page.waitForTimeout(2000);
      await vehiclesPage.expectVehicleVisible(make, model);

      await vehiclesPage.clickEditOnCard(make, model);
      await vehiclesPage.descriptionTextarea.fill('Updated by Playwright');
      await vehiclesPage.submitForm();

      await page.waitForTimeout(2000);
      await vehiclesPage.expectVehicleVisible(make, model);
      const card = await vehiclesPage.getVehicleCard(make, model);
      await expect(card).toContainText('Updated by Playwright');
    });

    test('Admin can delete a vehicle that has no active reservations', async ({ page }) => {
      const vehiclesPage = new VehiclesPage(page);
      await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
      await vehiclesPage.goto();
      await page.waitForTimeout(2000);

      const make = 'DeleteTest';
      const model = `Car${Date.now()}`;

      await vehiclesPage.openAddForm();
      await vehiclesPage.fillVehicleForm({
        make,
        model,
        year: '2022',
        price: '30',
        category: 'Hatchback',
        description: 'To be deleted',
      });
      await vehiclesPage.submitForm();
      await page.waitForTimeout(2000);
      await vehiclesPage.expectVehicleVisible(make, model);

      await vehiclesPage.clickDeleteOnCard(make, model);
      await expect(vehiclesPage.confirmDeleteButton).toBeVisible({ timeout: 5000 });
      await vehiclesPage.confirmDeleteButton.click();

      await page.waitForTimeout(2000);
      await vehiclesPage.expectVehicleNotVisible(make, model);
    });

    test('Admin can switch between All Vehicles and Available Only tabs', async ({ page }) => {
      const vehiclesPage = new VehiclesPage(page);
      await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
      await vehiclesPage.goto();
      await page.waitForTimeout(2000);

      const allCount = await page.locator('.grid > div').count();

      await vehiclesPage.availableOnlyTab.click();
      await page.waitForTimeout(2000);
      const availableCount = await page.locator('.grid > div').count();
      expect(availableCount).toBeLessThanOrEqual(allCount);

      await vehiclesPage.allVehiclesTab.click();
      await page.waitForTimeout(2000);
      const backToAllCount = await page.locator('.grid > div').count();
      expect(backToAllCount).toBeGreaterThanOrEqual(availableCount);
    });
  });

  test.describe('Admin — Sad Paths', () => {
    test('Add vehicle form requires all fields — cannot submit empty', async ({ page }) => {
      const vehiclesPage = new VehiclesPage(page);
      await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
      await vehiclesPage.goto();
      await page.waitForTimeout(2000);

      await vehiclesPage.openAddForm();
      await vehiclesPage.submitForm();

      await expect(vehiclesPage.makeInput).toBeVisible();
      await expect(vehiclesPage.makeInput).toBeFocused();
    });
  });

  test.describe('Customer — Happy Paths', () => {
    test('Customer can browse vehicles and see fleet', async ({ page }) => {
      const vehiclesPage = new VehiclesPage(page);
      await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
      await vehiclesPage.goto();
      await page.waitForTimeout(2000);

      const count = await page.locator('.grid > div').count();
      expect(count).toBeGreaterThan(0);
    });

    test('Customer can navigate to vehicle detail page', async ({ page }) => {
      const vehiclesPage = new VehiclesPage(page);
      await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
      await vehiclesPage.goto();
      await page.waitForTimeout(2000);

      const firstCard = page.locator('.grid > div').first();
      const vehicleName = await firstCard.locator('h3').innerText();
      const make = vehicleName.split(' ')[0];

      await firstCard.locator('button', { hasText: 'Details' }).click();
      await expect(page).toHaveURL(/\/vehicles\/\d+/);
      await expect(page.locator('h2').first()).toContainText(make);
    });

    test('Customer can filter to available-only vehicles', async ({ page }) => {
      const vehiclesPage = new VehiclesPage(page);
      await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
      await vehiclesPage.goto();
      await page.waitForTimeout(2000);

      await vehiclesPage.availableOnlyTab.click();
      await page.waitForTimeout(2000);

      const cards = page.locator('.grid > div');
      const count = await cards.count();
      if (count > 0) {
        const firstCard = cards.first();
        await expect(firstCard).toContainText('Available');
      }
    });
  });

  test.describe('Customer — Sad Paths', () => {
    test('Customer does not see Add Vehicle button', async ({ page }) => {
      const vehiclesPage = new VehiclesPage(page);
      await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
      await vehiclesPage.goto();
      await page.waitForTimeout(2000);
      await expect(vehiclesPage.addVehicleButton).not.toBeVisible();
    });

    test('Customer does not see Edit or Delete buttons on vehicle cards', async ({ page }) => {
      const vehiclesPage = new VehiclesPage(page);
      await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
      await vehiclesPage.goto();
      await page.waitForTimeout(2000);

      const firstCard = page.locator('.grid > div').first();
      await expect(firstCard.locator('button', { hasText: 'Edit' })).not.toBeVisible();
      await expect(firstCard.locator('button', { hasText: 'Delete' })).not.toBeVisible();
    });
  });

  test.describe('Access Control', () => {
    test('Customer cannot access /users — redirected to /unauthorized', async ({ page }) => {
      await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
      await page.goto('/users');
      await expect(page).toHaveURL(/\/unauthorized/);
      await expect(page.locator('h1', { hasText: 'Access Denied' })).toBeVisible();
    });

    test('Worker cannot access /users — redirected to /unauthorized', async ({ page }) => {
      await loginAs(page, process.env.WORKER_EMAIL!, process.env.WORKER_PASSWORD!);
      await page.goto('/users');
      await expect(page).toHaveURL(/\/unauthorized/);
    });

    test('Customer cannot access admin reservations /reservations — redirected to /unauthorized', async ({ page }) => {
      await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
      await page.goto('/reservations');
      await expect(page).toHaveURL(/\/unauthorized/);
    });

    test('Unauthorized page has a Back to Dashboard button', async ({ page }) => {
      await loginAs(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
      await page.goto('/users');
      await expect(page).toHaveURL(/\/unauthorized/);
      await page.locator('button', { hasText: 'Back to Dashboard' }).click();
      await expect(page).toHaveURL(/\/dashboard/);
    });
  });
});