import { test, expect } from '@playwright/test';
import { db, login, logout, register, PASSWORD } from './helpers';
import crypto from 'crypto';

test.describe('Authentication regression', () => {
  test('AUTH-01 register creates an httpOnly session and no token in localStorage', async ({ page }) => {
    await register(page, { first: 'Reg' });
    await expect(page).toHaveURL(/\/dashboard$/);
    const cookie = (await page.context().cookies()).find((c) => c.name === 'mc_session');
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe('Lax');
    expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => /token|user/i.test(k)))).toEqual([]);
  });

  test('AUTH-02 login then navigate across public, detail and dashboard pages keeps the user', async ({ page }) => {
    await login(page, 'customer@mobcheck.pk');
    const listingId = (await db.phoneListing.findFirstOrThrow({ where: { status: 'ACTIVE' } })).id;
    for (const path of ['/', '/marketplace', `/listings/${listingId}`, '/shops', '/shops/hafeez-mobile-hub', '/dashboard/bookings', '/dashboard/profile', '/dashboard']) {
      await page.goto(path);
      await expect(page.getByTestId('header-user-name'), `header on ${path}`).toHaveText('Sara');
    }
  });

  test('AUTH-03 refresh keeps the session and profile data', async ({ page }) => {
    await login(page, 'customer@mobcheck.pk');
    await page.goto('/dashboard/profile');
    await page.reload();
    await expect(page.getByLabel('First name')).toHaveValue('Sara');
    await expect(page.getByTestId('header-user-name')).toHaveText('Sara');
  });

  test('AUTH-04 protected URL opened directly redirects to login and returns after login', async ({ page }) => {
    await page.goto('/dashboard/listings');
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Fdashboard%2Flistings/);
    await page.getByLabel('Email address').fill('customer@mobcheck.pk');
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/dashboard\/listings$/);
  });

  test('AUTH-05 logout deletes the server session and protected pages redirect', async ({ page }) => {
    await login(page, 'customer@mobcheck.pk');
    const token = (await page.context().cookies()).find((c) => c.name === 'mc_session')!.value;
    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('menuitem', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/$/);
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    expect(await db.session.findUnique({ where: { token: hash } })).toBeNull();
    for (const path of ['/dashboard', '/vendor/shop', '/admin/shops', '/listings/new']) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/\/auth\/login/);
    }
    // Replaying the old cookie must not work either.
    await page.context().addCookies([{ name: 'mc_session', value: token, url: page.url() }]);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('AUTH-06 switching accounts shows the second user only', async ({ page }) => {
    await login(page, 'customer@mobcheck.pk');
    await logout(page);
    await login(page, 'shop@mobcheck.pk');
    await page.goto('/dashboard');
    await expect(page.getByTestId('header-user-name')).toHaveText('Ali');
    await expect(page.getByRole('link', { name: 'Shop profile' }).first()).toBeVisible();
  });

  test('AUTH-07 expired session redirects to login with an explanation', async ({ page }) => {
    await login(page, 'customer@mobcheck.pk');
    const token = (await page.context().cookies()).find((c) => c.name === 'mc_session')!.value;
    await db.session.update({ where: { token: crypto.createHash('sha256').update(token).digest('hex') }, data: { expiresAt: new Date(Date.now() - 1000) } });
    await page.goto('/dashboard/profile');
    await expect(page).toHaveURL(/\/auth\/login\?next=.*expired=1/);
    await expect(page.getByText('Your session has ended')).toBeVisible();
  });

  test('AUTH-08 tampered cookie is rejected', async ({ page, context }) => {
    await context.addCookies([{ name: 'mc_session', value: 'forged-value', url: 'http://localhost:3100' }]);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/);
    const res = await page.request.get('/api/auth/me');
    expect((await res.json()).user).toBeNull();
  });

  test('AUTH-09 roles only reach their own areas', async ({ page }) => {
    await login(page, 'customer@mobcheck.pk');
    for (const path of ['/admin/shops', '/admin/users', '/vendor/bookings', '/inspector']) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/\/dashboard\?denied=1/);
    }
    const api = await page.request.patch('/api/admin/users/x', { data: { status: 'SUSPENDED' } });
    expect(api.status()).toBe(403);
  });

  test('AUTH-10 wrong password and validation errors are shown', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Email address').fill('customer@mobcheck.pk');
    await page.getByLabel('Password').fill('nope-wrong-1');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByText('Incorrect email or password.')).toBeVisible();
    await page.goto('/auth/register');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('Enter a valid email address')).toBeVisible();
    await expect(page.getByText('First name is required')).toBeVisible();
  });

  test('AUTH-11 forgot and reset password', async ({ page }) => {
    const email = await register(page, { first: 'Reset' });
    await logout(page);
    await page.goto('/auth/forgot-password');
    await page.getByLabel('Email address').fill(email);
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await page.getByRole('link', { name: 'Open the reset link' }).click();
    await page.getByLabel('New password', { exact: true }).fill('NewPass456');
    await page.getByLabel('Confirm new password').fill('NewPass456');
    await page.getByRole('button', { name: 'Update password' }).click();
    await expect(page).toHaveURL(/reset=1/);
    await login(page, email, 'NewPass456');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('AUTH-12 cross-origin writes are rejected', async ({ page }) => {
    await login(page, 'customer@mobcheck.pk');
    const res = await page.request.patch('/api/auth/me', { data: { firstName: 'Evil', lastName: 'Site' }, headers: { Origin: 'https://evil.example' } });
    expect(res.status()).toBe(403);
  });
});
