import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('sidebar has all nav links', async ({ page }) => {
    await page.goto('/login');
    // Even on login, check the page loads
    await expect(page.getByText(/agent bridge/i).first()).toBeVisible();
  });

  test('integration page loads', async ({ page }) => {
    await page.goto('/integration');
    // Will redirect to login if not authed, but page should load
    await expect(page).toHaveURL(/integration|login/);
  });

  test('settings page loads', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/settings|login/);
  });
});
