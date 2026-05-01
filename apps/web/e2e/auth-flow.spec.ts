import { test, expect } from '@playwright/test';

test.describe('Auth flow (full)', () => {
  const admin = { name: 'Test Admin', email: `admin-${Date.now()}@test.com`, password: 'testpass123' };

  test('create admin → login → see dashboard', async ({ page }) => {
    // Setup
    await page.goto('/setup');
    await page.getByLabel('Name').fill(admin.name);
    await page.getByLabel('Email').fill(admin.email);
    await page.getByLabel('Password').fill(admin.password);
    await page.getByRole('button', { name: /create admin/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/', { timeout: 10000 });
    await expect(page.getByText(/sessions/i).first()).toBeVisible();
  });

  test('after setup, /setup redirects to /login', async ({ page }) => {
    await page.goto('/setup');
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });
});
