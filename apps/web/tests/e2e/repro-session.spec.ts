import { test, expect } from '@playwright/test';

test('session persists across navigation and refresh, and logout invalidates it', async ({ page }) => {
  await page.goto('/auth/login');
  await page.getByLabel('Email address').fill('customer@mobcheck.pk');
  await page.getByLabel('Password').fill('Password123');
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL('**/dashboard');
  await expect(page.getByRole('heading', { name: /Welcome back, Sara/ })).toBeVisible();

  const cookies = await page.context().cookies();
  const session = cookies.find((c) => c.name === 'mc_session');
  expect(session?.httpOnly).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();

  await page.goto('/dashboard/profile');
  await expect(page.getByTestId('header-user-name')).toHaveText('Sara');
  await page.reload();
  await expect(page.getByTestId('header-user-name')).toHaveText('Sara');
  await expect(page.getByLabel('First name')).toHaveValue('Sara');

  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: 'Log out' }).click();
  await page.waitForURL((u) => u.pathname === '/');
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/auth\/login\?next=%2Fdashboard/);
});
