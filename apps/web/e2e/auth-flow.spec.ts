import { test, expect } from '@playwright/test';

test.describe('Auth flow', () => {
  test('/setup page is accessible without auth', async ({ page }) => {
    await page.goto('/setup');
    await expect(page.locator('input[id="email"]')).toBeVisible({ timeout: 5000 });
  });

  test('/accept-invite page is accessible without auth', async ({ page }) => {
    await page.goto('/accept-invite?token=fake');
    // Should show the form or an error about invalid token
    const page_content = await page.textContent('body');
    expect(page_content).toBeTruthy();
  });

  test('/login page is accessible without auth', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('button[type="submit"]')).toBeVisible({ timeout: 5000 });
  });
});
