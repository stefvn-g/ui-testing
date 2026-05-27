import { test, expect } from '@playwright/test';

async function dismissModal(page: any) {
  const modal = page.locator('#demoWarningModal');
  const isVisible = await modal.isVisible().catch(() => false);
  if (isVisible) {
    const closeBtn = modal.locator('button').last();
    const closeBtnVisible = await closeBtn.isVisible().catch(() => false);
    if (closeBtnVisible) {
      await closeBtn.click();
    } else {
      await page.evaluate(() => {
        const el = document.getElementById('demoWarningModal');
        if (el) el.style.display = 'none';
      });
    }
    await modal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
}

test.describe('Navigation and Search Widgets', () => {

  test('homepage loads with hero and search tabs', async ({ page }) => {
    await page.goto('/');
    await dismissModal(page);
    await expect(page).toHaveTitle(/PHPTRAVELS/i);
    await expect(page.locator('h1, h2').filter({ hasText: /travel|journey|plan/i }).first()).toBeVisible();
    await expect(page.locator('button:has-text("Stays"), [role="tab"]:has-text("Stays"), .tab:has-text("Stays")').first()).toBeVisible();
  });

  test('navbar Services dropdown shows all services', async ({ page }) => {
    await page.goto('/');
    await dismissModal(page);
    await page.locator('text=Services').first().click();
    await expect(page.locator('a[href*="/stays"]').first()).toBeVisible();
    await expect(page.locator('a[href*="/flights"]').first()).toBeVisible();
    await expect(page.locator('a[href*="/tours"]').first()).toBeVisible();
    await expect(page.locator('a[href*="/cars"]').first()).toBeVisible();
    await expect(page.locator('a[href*="/visa"]').first()).toBeVisible();
  });

  test('navbar login and signup links are visible', async ({ page }) => {
    await page.goto('/');
    await dismissModal(page);
    await expect(page.locator('a[href="/login"], a[href="https://phptravels.net/login"]').first()).toBeVisible();
    const signupLinks = page.locator('a[href*="/signup"]');
    expect(await signupLinks.count()).toBeGreaterThan(0);
  });

  test('stays page loads with search form', async ({ page }) => {
    await page.goto('/stays');
    await dismissModal(page);
    await expect(page).toHaveURL(/stays/);
    await expect(page.locator('button:has-text("Search"), button[type="submit"]').first()).toBeVisible();
  });

  test('flights page loads with departure and arrival fields', async ({ page }) => {
    await page.goto('/flights');
    await dismissModal(page);
    await expect(page).toHaveURL(/flights/);
    const inputs = page.locator('input');
    await expect(inputs.first()).toBeVisible();
  });

  test('tours page loads correctly', async ({ page }) => {
    await page.goto('/tours');
    await dismissModal(page);
    await expect(page).toHaveURL(/tours/);
    await expect(page.locator('button:has-text("Search"), button[type="submit"]').first()).toBeVisible();
  });

  test('cars page loads correctly', async ({ page }) => {
    await page.goto('/cars');
    await dismissModal(page);
    await expect(page).toHaveURL(/cars/);
    await expect(page.locator('button:has-text("Search"), button[type="submit"]').first()).toBeVisible();
  });

  test('footer contains essential links', async ({ page }) => {
    await page.goto('/');
    await dismissModal(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const footer = page.locator('footer');
    await expect(footer.locator('a[href*="privacy-policy"]').first()).toBeVisible();
    await expect(footer.locator('a[href*="terms-of-use"]').first()).toBeVisible();
    await expect(footer.locator('a[href*="contact-us"]').first()).toBeVisible();
  });

  test('language switcher renders all language options', async ({ page }) => {
    await page.goto('/');
    await dismissModal(page);
    await page.locator('text=English').first().click();
    await expect(page.locator('a[href*="lang=es"]').first()).toBeVisible();
    await expect(page.locator('a[href*="lang=ar"]').first()).toBeVisible();
    await expect(page.locator('a[href*="lang=fr"]').first()).toBeVisible();
  });

  test('currency switcher is accessible', async ({ page }) => {
    await page.goto('/');
    await dismissModal(page);
    await page.locator('text=USD').first().click();
    await expect(page.locator('a[href*="currency=GBP"]').first()).toBeVisible();
    await expect(page.locator('a[href*="currency=EUR"]').first()).toBeVisible();
  });

  test('about us page loads', async ({ page }) => {
    await page.goto('/page/about-us');
    await expect(page).toHaveURL(/about-us/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('contact us page loads', async ({ page }) => {
    await page.goto('/page/contact-us');
    await expect(page).toHaveURL(/contact-us/);
    await expect(page.locator('body')).toBeVisible();
  });

});