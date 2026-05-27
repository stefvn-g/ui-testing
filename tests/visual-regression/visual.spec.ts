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

async function prepPage(page: any, url: string) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await dismissModal(page);
  // Freeze dynamic content so snapshots are stable
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }
      img { visibility: visible !important; }
    `
  });
  // Short settle time after style injection
  await page.waitForTimeout(300);
}

test.describe('Visual Regression', () => {

  test('homepage matches visual snapshot', async ({ page }) => {
    await prepPage(page, '/');
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('login page matches visual snapshot', async ({ page }) => {
    await prepPage(page, '/login');
    await expect(page).toHaveScreenshot('login.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('signup page matches visual snapshot', async ({ page }) => {
    await prepPage(page, '/signup');
    await expect(page).toHaveScreenshot('signup.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('stays page matches visual snapshot', async ({ page }) => {
    await prepPage(page, '/stays');
    await expect(page).toHaveScreenshot('stays.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('flights page matches visual snapshot', async ({ page }) => {
    await prepPage(page, '/flights');
    await expect(page).toHaveScreenshot('flights.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });
  });

});