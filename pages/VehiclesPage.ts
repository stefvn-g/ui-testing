import { type Page, type Locator, expect } from '@playwright/test';

export class VehiclesPage {
  readonly page: Page;

  readonly addVehicleButton: Locator;
  readonly allVehiclesTab: Locator;
  readonly availableOnlyTab: Locator;
  readonly errorMessage: Locator;

  readonly vehicleCards: Locator;

  readonly makeInput: Locator;
  readonly modelInput: Locator;
  readonly yearInput: Locator;
  readonly priceInput: Locator;
  readonly categorySelect: Locator;
  readonly statusSelect: Locator;
  readonly descriptionTextarea: Locator;
  readonly formSubmitButton: Locator;
  readonly formCancelButton: Locator;

  readonly confirmDeleteButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.addVehicleButton = page.locator('button', { hasText: 'Add Vehicle' }).first();
    this.allVehiclesTab = page.locator('button', { hasText: 'All Vehicles' });
    this.availableOnlyTab = page.locator('button', { hasText: 'Available Only' });
    this.errorMessage = page.locator('.bg-red-500\\/10').first();

    this.vehicleCards = page.locator('.grid > div');

    this.makeInput = page.locator('input[name="make"]');
    this.modelInput = page.locator('input[name="model"]');
    this.yearInput = page.locator('input[name="year"]');
    this.priceInput = page.locator('input[name="pricePerDay"]');
    this.categorySelect = page.locator('select[name="category"]');
    this.statusSelect = page.locator('select[name="status"]');
    this.descriptionTextarea = page.locator('textarea[name="description"]');
    this.formSubmitButton = page.locator('form button[type="submit"]');
    this.formCancelButton = page.locator('form button[type="button"]');

    this.confirmDeleteButton = page.locator('.fixed button', {
      hasText: 'Delete',
    });
  }

  async goto() {
    await this.page.goto('/vehicles');
  }

  async waitForVehicles() {
    await this.page
      .waitForSelector('[data-vehicle-card], .grid > div > div', {
        timeout: 20000,
      })
      .catch(() => {});

    await this.page.waitForTimeout(1000);
  }

  async getVehicleCount(): Promise<number> {
    await this.page.waitForTimeout(500);
    return await this.vehicleCards.count();
  }

  async openAddForm() {
    await this.addVehicleButton.click();
    await expect(this.makeInput).toBeVisible({ timeout: 5000 });
  }

  async fillVehicleForm(data: {
    make: string;
    model: string;
    year: string;
    price: string;
    category: string;
    description: string;
  }) {
    await this.makeInput.fill(data.make);
    await this.modelInput.fill(data.model);
    await this.yearInput.fill(data.year);
    await this.priceInput.fill(data.price);
    await this.categorySelect.selectOption(data.category);
    await this.descriptionTextarea.fill(data.description);
  }

  async submitForm() {
    await this.formSubmitButton.click();
  }

  async getVehicleCard(make: string, model: string) {
    return this.vehicleCards
      .filter({ hasText: `${make} ${model}` })
      .first();
  }

  async clickEditOnCard(make: string, model: string) {
    const card = await this.getVehicleCard(make, model);

    await card.locator('button', { hasText: 'Edit' }).click();
    await expect(this.makeInput).toBeVisible({ timeout: 5000 });
  }

  async clickDeleteOnCard(make: string, model: string) {
    const card = await this.getVehicleCard(make, model);

    await card.locator('button', { hasText: 'Delete' }).click();
  }

  async expectVehicleVisible(make: string, model: string) {
    await expect(
      this.vehicleCards
        .filter({ hasText: `${make} ${model}` })
        .first()
    ).toBeVisible({ timeout: 15000 });
  }

  async expectVehicleNotVisible(make: string, model: string) {
    await expect(
      this.vehicleCards.filter({ hasText: `${make} ${model}` })
    ).toHaveCount(0, { timeout: 10000 });
  }
}