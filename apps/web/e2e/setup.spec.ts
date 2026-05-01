import { test, expect } from '@playwright/test';

test.describe('Setup flow', () => {
  test('/ loads without crashing', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status()).toBeLessThan(500);
  });

  test('/login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[id="email"]')).toBeVisible({ timeout: 5000 });
  });

  test('/setup page renders admin form', async ({ page }) => {
    await page.goto('/setup');
    await expect(page.locator('input[id="name"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
  });
});
