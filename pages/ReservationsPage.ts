import { type Page, type Locator, expect } from '@playwright/test';

export class ReservationsPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly reservationItems: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator('input[placeholder="Search by customer or vehicle..."]');
    this.reservationItems = page.locator('.space-y-3 > div');
  }

  async goto() {
    await this.page.goto('/reservations');
  }

  async waitForReservations() {
    await this.page.waitForSelector('.space-y-3 > div', { timeout: 15000 }).catch(() => {});
  }

  async filterByStatus(status: string) {
    await this.page.locator('button', { hasText: status }).filter({ hasNot: this.page.locator('.space-y-3') }).first().click();
  }

  async searchFor(query: string) {
    await this.searchInput.fill(query);
  }

  async clickActionOnReservation(vehicleName: string, action: 'Approve' | 'Reject' | 'Complete' | 'Cancel') {
    const card = this.page.locator('.space-y-3 > div').filter({ hasText: vehicleName }).first();
    await card.locator('button', { hasText: action }).click();
  }

  async confirmAction(confirmLabel: string) {
    const btn = this.page.locator(`button:has-text("${confirmLabel}")`).last();
    await expect(btn).toBeVisible({ timeout: 5000 });
    await btn.click();
  }

  async expectReservationVisible(vehicleName: string) {
    await expect(
      this.page.locator('.space-y-3 > div').filter({ hasText: vehicleName }).first()
    ).toBeVisible({ timeout: 15000 });
  }

  async expectStatusBadge(vehicleName: string, status: string) {
    const card = this.page.locator('.space-y-3 > div').filter({ hasText: vehicleName }).first();
    await expect(card).toContainText(status, { timeout: 10000 });
  }
}