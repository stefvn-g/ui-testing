import { type Page, type Locator, expect } from '@playwright/test';

export class UsersPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly userRows: Locator;

  // Edit modal
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly roleSelect: Locator;
  readonly saveButton: Locator;
  readonly modalCancelButton: Locator;

  // Delete confirm
  readonly confirmDeleteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator('input[placeholder="Search by name or email..."]');
    this.userRows = page.locator('.bg-slate-900.border.border-slate-800.rounded-2xl > div');

    this.firstNameInput = page.locator('input[name="firstName"]');
    this.lastNameInput = page.locator('input[name="lastName"]');
    this.emailInput = page.locator('input[name="email"]');
    this.roleSelect = page.locator('select[name="role"]');
    this.saveButton = page.locator('button', { hasText: 'Save Changes' });
    this.modalCancelButton = page.locator('button', { hasText: 'Cancel' }).first();
    this.confirmDeleteButton = page.locator('button', { hasText: 'Delete' }).last();
  }

  async goto() {
    await this.page.goto('/users');
  }

  async waitForUsers() {
    await this.page.waitForSelector('.bg-slate-900.border.border-slate-800.rounded-2xl > div', { timeout: 15000 }).catch(() => {});
  }

  async searchFor(query: string) {
    await this.searchInput.fill(query);
  }

  async clickEditForUser(email: string) {
    const row = this.page.locator('div').filter({ hasText: email }).filter({ has: this.page.locator('button', { hasText: 'Edit' }) }).first();
    await row.locator('button', { hasText: 'Edit' }).click();
    await expect(this.firstNameInput).toBeVisible();
  }

  async updateUserRole(role: string) {
    await this.roleSelect.selectOption(role);
    await this.saveButton.click();
  }

  async clickDeleteForUser(email: string) {
    const row = this.page.locator('div').filter({ hasText: email }).filter({ has: this.page.locator('button', { hasText: 'Delete' }) }).first();
    await row.locator('button', { hasText: 'Delete' }).click();
    await expect(this.confirmDeleteButton).toBeVisible();
  }

  async confirmDelete() {
    await this.confirmDeleteButton.click();
  }

  async expectUserVisible(email: string) {
    await expect(this.page.locator('p', { hasText: email }).first()).toBeVisible({ timeout: 10000 });
  }

  async expectUserNotVisible(email: string) {
    await expect(this.page.locator('p', { hasText: email })).toHaveCount(0);
  }

  async filterByRole(role: 'All' | 'Admin' | 'Worker' | 'Customer') {
    await this.page.locator('button', { hasText: role }).filter({ hasNot: this.page.locator('.bg-slate-900.border.border-slate-800.rounded-2xl') }).first().click();
  }
}