import { type Page, type Locator, expect } from '@playwright/test';

export class VehicleDetailPage {
  readonly page: Page;
  readonly reserveButton: Locator;
  readonly backButton: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly confirmReservationButton: Locator;
  readonly reservationModalCancelButton: Locator;
  readonly reserveSuccessMessage: Locator;
  readonly reservationError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.reserveButton = page.locator('button', { hasText: 'Reserve This Vehicle' });
    this.backButton = page.locator('button', { hasText: 'Back' });
    this.startDateInput = page.locator('input[type="date"]').first();
    this.endDateInput = page.locator('input[type="date"]').last();
    this.confirmReservationButton = page.locator('button', { hasText: 'Confirm Reservation' });
    this.reservationModalCancelButton = page.locator('button', { hasText: 'Cancel' }).last();
    this.reserveSuccessMessage = page.locator('.bg-emerald-500\\/15');
    this.reservationError = page.locator('.bg-red-500\\/15').last();
  }

  async expectOnDetailPage(make: string, model: string) {
    await expect(this.page).toHaveURL(/\/vehicles\/\d+/);
    await expect(this.page.locator('h2').filter({ hasText: `${make} ${model}` })).toBeVisible();
  }

  async openReservationModal() {
    await this.reserveButton.click();
    await expect(this.startDateInput).toBeVisible();
  }

  async fillReservationDates(startDate: string, endDate: string) {
    await this.startDateInput.fill(startDate);
    await this.endDateInput.fill(endDate);
  }

  async submitReservation() {
    await this.confirmReservationButton.click();
  }

  async expectReservationSuccess() {
    await expect(this.reserveSuccessMessage).toBeVisible({ timeout: 15000 });
  }

  async expectReservationError(text: string) {
    await expect(this.reservationError).toBeVisible();
    await expect(this.reservationError).toContainText(text);
  }
}