import { type Page, type Locator, expect } from '@playwright/test';

export class MyReservationsPage {
  readonly page: Page;
  readonly newReservationButton: Locator;
  readonly reservationItems: Locator;
  readonly emptyStateMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newReservationButton = page.locator('button', { hasText: 'New Reservation' });
    this.reservationItems = page.locator('.space-y-3 > div');
    this.emptyStateMessage = page.locator('p', { hasText: 'No reservations yet' });
  }

  async goto() {
    await this.page.goto('/reservations/my');
  }

  async waitForReservations() {
    await this.page.waitForSelector('.space-y-3 > div', { timeout: 15000 }).catch(() => {});
  }

  async expectReservationWithVehicle(vehicleName: string) {
    await expect(
      this.page.locator('.space-y-3 > div').filter({ hasText: vehicleName }).first()
    ).toBeVisible({ timeout: 15000 });
  }

  async cancelReservationFor(vehicleName: string) {
    const card = this.page.locator('.space-y-3 > div').filter({ hasText: vehicleName }).first();
    await card.locator('button', { hasText: 'Cancel' }).click();
    const confirmBtn = this.page.locator('button', { hasText: 'Cancel Reservation' });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();
  }

  async expectStatusFor(vehicleName: string, status: string) {
    const card = this.page.locator('.space-y-3 > div').filter({ hasText: vehicleName }).first();
    await expect(card).toContainText(status);
  }
}