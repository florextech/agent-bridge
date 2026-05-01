import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
  test('renders login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[id="email"]').fill('wrong@test.com');
    await page.locator('input[id="password"]').fill('wrongpass');
    await page.locator('button[type="submit"]').click();
    // Wait for error message to appear
    await expect(page.locator('[data-testid="Alert"], [role="alert"]').or(page.getByText(/invalid|error|failed/i))).toBeVisible({ timeout: 10000 });
  });
});
