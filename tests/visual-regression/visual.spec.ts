import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {

  test('homepage matches visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Hide dynamic elements that change every run
    await page.addStyleTag({
      content: `
        img { animation: none !important; transition: none !important; }
      `
    });
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('login page matches visual snapshot', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('login.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('signup page matches visual snapshot', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('signup.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('stays page matches visual snapshot', async ({ page }) => {
    await page.goto('/stays');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('stays.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('flights page matches visual snapshot', async ({ page }) => {
    await page.goto('/flights');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('flights.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

});