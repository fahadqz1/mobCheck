import { test, expect } from '@playwright/test';

// Reproduction for BUG-D against the original implementation.
test('session survives navigation after login (repro)', async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('input[type=email]', 'customer@mobcheck.pk');
  await page.fill('input[type=password]', 'Password123');
  await page.click('button[type=submit]');
  await page.waitForURL('**/dashboard');
  await expect(page.getByText('Welcome, Sara')).toBeVisible();

  await page.goto('/marketplace');
  const headerShowsLogin = await page.locator('nav a[href="/auth/login"]').isVisible();
  const ls = await page.evaluate(() => Object.keys(localStorage));
  const cookies = await page.context().cookies();
  console.log(JSON.stringify({ headerShowsLogin, localStorageKeys: ls, cookieNames: cookies.map((c) => c.name) }));
});
