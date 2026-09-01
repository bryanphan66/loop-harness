import { expect, test } from '@playwright/test';

const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin1234';

test('unauthenticated visit to a guarded page redirects to /login', async ({ page }) => {
  await page.goto('/users');
  await expect(page).toHaveURL(/\/login/);
});

test('seeded admin can log in and reach the dashboard and users table', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  await page.getByRole('link', { name: 'Users', exact: true }).click();
  await expect(page).toHaveURL(/\/users/);
  await expect(page.getByTestId('users-table')).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
});
