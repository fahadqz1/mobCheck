import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { db, expectNoHorizontalScroll, login } from './helpers';

const publicPages = async () => {
  const listing = await db.phoneListing.findFirstOrThrow({ where: { status: 'ACTIVE' } });
  return ['/', '/marketplace', '/shops', '/shops/hafeez-mobile-hub', `/listings/${listing.id}`, '/verify', '/auth/login', '/auth/register'];
};

test.describe('Header and responsive layout @responsive', () => {
  test('LAYOUT-01 header auth controls keep the same position and size on every public page', async ({ page }) => {
    test.setTimeout(120_000);
    const isMobile = (page.viewportSize()?.width ?? 1440) < 768;
    const boxes: Record<string, unknown> = {};
    const heights = new Set<number>();
    for (const path of await publicPages()) {
      await page.goto(path);
      heights.add((await page.locator('header').first().boundingBox())!.height);
      if (isMobile) {
        boxes[path] = await page.getByRole('button', { name: 'Open menu' }).boundingBox();
      } else {
        boxes[path] = {
          login: await page.getByRole('link', { name: 'Log in', exact: true }).first().boundingBox(),
          signup: await page.getByRole('link', { name: 'Sign up', exact: true }).first().boundingBox(),
        };
      }
      await expectNoHorizontalScroll(page);
    }
    const [first, ...rest] = Object.values(boxes);
    for (const [i, b] of rest.entries()) expect(b, `auth controls moved on ${Object.keys(boxes)[i + 1]}`).toEqual(first);
    expect(heights.size, 'header height is identical on every page').toBe(1);
  });

  test('LAYOUT-02 signed-in header is identical across pages and after refresh', async ({ page }) => {
    const isMobile = (page.viewportSize()?.width ?? 1440) < 768;
    await login(page, 'customer@mobcheck.pk');
    const target = isMobile ? page.getByRole('button', { name: 'Open menu' }) : page.getByRole('button', { name: /account menu/i });
    const boxes = [];
    for (const path of ['/', '/marketplace', '/dashboard', '/dashboard/profile']) {
      await page.goto(path);
      boxes.push(await target.boundingBox());
      await expectNoHorizontalScroll(page);
    }
    await page.reload();
    boxes.push(await target.boundingBox());
    for (const b of boxes.slice(1)) expect(b).toEqual(boxes[0]);
  });

  test('LAYOUT-03 mobile menu opens, navigates and closes @mobile', async ({ page }) => {
    const isMobile = (page.viewportSize()?.width ?? 1440) < 768;
    test.skip(!isMobile, 'mobile only');
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    const nav = page.getByRole('navigation', { name: 'Mobile' });
    await expect(nav.getByRole('link', { name: 'Log in' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Sign up' })).toBeVisible();
    await nav.getByRole('link', { name: 'Inspection shops' }).click();
    await expect(page).toHaveURL(/\/shops$/);
    await expect(nav).toBeHidden();
  });

  test('LAYOUT-04 dashboards fit every screen size', async ({ page }) => {
    test.setTimeout(300_000);
    for (const [email, paths] of [
      ['customer@mobcheck.pk', ['/dashboard', '/dashboard/bookings', '/dashboard/listings', '/dashboard/profile', '/listings/new', '/bookings/new']],
      ['shop@mobcheck.pk', ['/dashboard', '/vendor/shop', '/vendor/services', '/vendor/bookings', '/vendor/inspectors', '/vendor/reviews', '/vendor/subscription']],
      ['admin@mobcheck.pk', ['/dashboard', '/admin/shops', '/admin/listings', '/admin/bookings', '/admin/complaints', '/admin/users', '/admin/payments']],
    ] as const) {
      await page.request.post('/api/auth/logout');
      await login(page, email);
      for (const path of paths) {
        const res = await page.goto(path);
        expect(res?.status(), `${email} ${path}`).toBe(200);
        await expect(page.locator('h1').first()).toBeVisible();
        await expectNoHorizontalScroll(page);
      }
    }
  });
});

test.describe('Accessibility', () => {
  test('A11Y-01 key pages have no serious or critical WCAG 2.1 AA violations', async ({ page }) => {
    test.setTimeout(180_000);
    const report: string[] = [];
    const check = async (path: string) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      for (const v of results.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical')) {
        report.push(`${path}: [${v.impact}] ${v.id} - ${v.help} (${v.nodes.length}) e.g. ${v.nodes[0]?.target.join(' ')}`);
      }
    };
    for (const path of await publicPages()) await check(path);
    await login(page, 'customer@mobcheck.pk');
    for (const path of ['/dashboard', '/dashboard/profile', '/listings/new']) await check(path);
    console.log(report.join('\n') || 'no serious/critical violations');
    expect(report).toEqual([]);
  });

  test('A11Y-02 the main flows work with the keyboard alone', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.goto('/auth/login');
    await page.getByLabel('Email address').focus();
    await page.keyboard.type('customer@mobcheck.pk');
    await page.keyboard.press('Tab');
    await page.keyboard.type('Password123');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    const menu = page.getByRole('button', { name: /account menu/i });
    await menu.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toBeHidden();
  });
});
