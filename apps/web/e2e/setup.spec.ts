import { test, expect } from '@playwright/test';

test.describe('Setup flow', () => {
  test('redirects to /setup when no users exist', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/setup|login/);
  });

  test('/setup page renders admin form', async ({ page }) => {
    await page.goto('/setup');
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /create admin/i })).toBeVisible();
  });
});
