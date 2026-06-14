import { type Page, type Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly greeting: Locator;
  readonly signOutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.greeting = page.locator('h2').filter({ hasText: /Good (morning|afternoon|evening)/ });
    this.signOutButton = page.locator('button', { hasText: 'Sign out' });
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async logout() {
    await this.signOutButton.click();
    await expect(this.page).toHaveURL(/\/login/);
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 30000 });
    await expect(this.greeting).toBeVisible({ timeout: 30000 });
  }

  async expectRoleBadge(role: string) {
    await expect(this.page.getByText(role, { exact: true }))
        .toBeVisible({ timeout: 15000 });
    }

  async expectStatSectionVisible(heading: string) {
    await expect(this.page.locator('h3', { hasText: heading })).toBeVisible();
  }
}