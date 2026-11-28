import { test, expect, Page } from '@playwright/test';
import { createRequire } from 'node:module';
import { db, login, logout, photo, register } from './helpers';

const sharp = createRequire(__filename)('sharp');

test.describe.configure({ mode: 'serial', timeout: 150_000 });
const state: Record<string, string> = {};

async function openChatForListing(page: Page, listingId: string) {
  await page.goto(`/listings/${listingId}`);
  await page.getByRole('button', { name: 'Chat with seller' }).click();
  await expect(page).toHaveURL(/\/messages\?c=/, { timeout: 30_000 });
  return new URL(page.url()).searchParams.get('c')!;
}

async function send(page: Page, text: string) {
  const box = page.getByLabel('Message', { exact: true });
  await box.fill(text);
  await page.getByRole('button', { name: 'Send message' }).click();
}

test('FEAT-01 home shows the new badge and the help assistant answers with a WhatsApp handoff', async ({ page }) => {
  // Compile the API route first: a cold compile in the dev server can trigger a full page reload mid-test.
  await page.request.post('/api/assistant', { data: { messages: [{ role: 'user', content: 'hi' }], page: '/' } });
  await page.goto('/');
  await expect(page.getByText("Pakistan's 1st Phone Inspection Marketplace")).toBeVisible();
  await page.getByRole('button', { name: /Open help/ }).click();
  const widget = page.getByTestId('help-widget');
  await expect(widget).toBeVisible();
  await widget.getByRole('button', { name: 'How much does it cost?' }).click();
  await expect(widget.getByText(/Rs 1,000/).last()).toBeVisible({ timeout: 60_000 });
  const wa = widget.getByTestId('help-whatsapp');
  const href = (await wa.getAttribute('href'))!;
  expect(href).toContain('https://wa.me/923174351383?text=');
  expect(decodeURIComponent(href)).toContain('How much does it cost?');
  await page.keyboard.press('Escape');
  await expect(widget).toBeHidden();
});

test('FEAT-02 contact details are blocked in chat with a warning; normal messages and IMEIs go through', async ({ page }) => {
  // A seller with a listing, and a buyer.
  state.sellerEmail = await register(page, { first: 'Chatseller', phone: '0321 7654321' });
  const seller = await db.user.findUniqueOrThrow({ where: { email: state.sellerEmail } });
  const model = await db.model.findFirstOrThrow({ where: { slug: 'iphone-15-pro' } });
  const listing = await db.phoneListing.create({
    data: { userId: seller.id, brandId: model.brandId, modelId: model.id, condition: 'GOOD', pricePkr: 250000, title: 'iPhone 15 Pro chat test', locationCity: 'Lahore', locationArea: 'Johar Town', sellerContactPreference: 'PLATFORM' },
  });
  state.listingId = listing.id;
  await logout(page);

  state.buyerEmail = await register(page, { first: 'Chatbuyer' });
  state.convId = await openChatForListing(page, listing.id);

  await send(page, 'Hi, is it still available? IMEI 356789104523689 for the PTA check');
  await expect(page.getByLabel('Message', { exact: true })).toHaveValue('', { timeout: 30_000 });
  await expect(page.getByRole('region', { name: 'Conversation' }).getByText('Hi, is it still available?')).toBeVisible();

  // Typing a number shows the warning before sending.
  await page.getByLabel('Message', { exact: true }).fill('call me on 0300 1234567');
  await expect(page.getByTestId('chat-warning')).toContainText('phone number');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByTestId('blocked-message').filter({ hasText: 'call me on 0300 1234567' })).toContainText('Not sent: contains a phone number');

  for (const attempt of ['email me ali.khan@gmail.com', 'zero three zero zero one two three four five six seven', 'add me wa.me/923001234567']) {
    await send(page, attempt);
    await expect(page.getByTestId('blocked-message').filter({ hasText: attempt })).toBeVisible();
  }
  const statuses = await db.message.groupBy({ by: ['status'], where: { conversationId: state.convId }, _count: true });
  expect(Object.fromEntries(statuses.map((s) => [s.status, s._count]))).toEqual({ DELIVERED: 1, BLOCKED: 4 });
  await logout(page);

  // The seller sees only the delivered message.
  await login(page, state.sellerEmail);
  await page.goto(`/messages?c=${state.convId}`);
  await expect(page.getByRole('region', { name: 'Conversation' }).getByText('Hi, is it still available?')).toBeVisible();
  await expect(page.getByText('0300 1234567')).toHaveCount(0);
  await expect(page.getByText('ali.khan@gmail.com')).toHaveCount(0);
  const api = await page.request.get(`/api/conversations/${state.convId}/messages`);
  expect((await api.json()).messages).toHaveLength(1);
});

test('FEAT-03 chat photos are watermarked and held for review until an admin approves them', async ({ page }) => {
  await login(page, state.buyerEmail);
  await page.goto(`/messages?c=${state.convId}`);
  await page.getByTestId('chat-photo-input').setInputFiles(photo('back.png', [40, 40, 40]));
  await expect(page.getByText('Waiting for safety check')).toBeVisible({ timeout: 30_000 });
  const pending = await db.message.findFirstOrThrow({ where: { conversationId: state.convId, status: 'PENDING_REVIEW' } });
  const imageUrl = `/api/files/${pending.imageKey}`;
  expect((await page.request.get(imageUrl)).status()).toBe(200);
  await logout(page);

  // The seller cannot see it yet.
  await login(page, state.sellerEmail);
  expect((await page.request.get(imageUrl)).status()).toBe(404);
  await logout(page);

  await login(page, 'admin@mobcheck.pk');
  await page.goto('/admin/moderation');
  await expect(page.getByText('Automatic photo checks are off')).toBeVisible();
  await expect(page.getByText('Chatbuyer User').first()).toBeVisible();
  await page.getByRole('button', { name: 'Approve' }).first().click();
  await expect(page.getByTestId('toast').filter({ hasText: 'Photo delivered' })).toBeVisible();
  await expect(page.getByText(/blocked/).first()).toBeVisible();
  await logout(page);

  await login(page, state.sellerEmail);
  const res = await page.request.get(imageUrl);
  expect(res.status()).toBe(200);
  const meta = await sharp(Buffer.from(await res.body())).metadata();
  expect(meta.format).toBe('jpeg');
  expect(meta.exif).toBeUndefined();
});

test('FEAT-04 listing photos are watermarked, resized and stripped of metadata', async ({ page }) => {
  await login(page, state.sellerEmail);
  const big = await sharp({ create: { width: 2400, height: 1800, channels: 3, background: '#2563eb' } })
    .withMetadata({ exif: { IFD0: { Make: 'TestPhone' } } })
    .jpeg()
    .toBuffer();
  const up = await page.request.post(`/api/listings/${state.listingId}/photos`, { multipart: { file: { name: 'big.jpg', mimeType: 'image/jpeg', buffer: big } } });
  expect(up.status(), await up.text()).toBe(201);
  const { data } = await up.json();
  const img = Buffer.from(await (await page.request.get(data.url)).body());
  const meta = await sharp(img).metadata();
  expect(meta.width).toBe(1600);
  expect(meta.exif).toBeUndefined();
  // The badge sits in the bottom-right corner: those pixels are dark ink, not the blue photo.
  const { data: px } = await sharp(img).extract({ left: 1600 - 60, top: 1200 - 40, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
  expect(px[2]).toBeLessThan(120);
});

test('FEAT-05 shop and listing pages never expose phone numbers or emails; shops are reachable by chat', async ({ page }) => {
  await page.goto('/shops/hafeez-mobile-hub');
  const html = await page.content();
  expect(html).not.toContain('+92 300 1234567');
  expect(html).not.toContain('hafeez-mobile-hub@example.com');
  await expect(page.getByRole('link', { name: 'Log in to message shop' })).toBeVisible();

  await login(page, state.buyerEmail);
  await page.goto('/shops/hafeez-mobile-hub');
  await page.getByRole('button', { name: 'Message shop' }).click();
  await expect(page).toHaveURL(/\/messages\?c=/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: 'Hafeez Mobile Hub' }).or(page.getByText('Hafeez Mobile Hub').first())).toBeVisible();
});

test('FEAT-06 saved phones persist on this device', async ({ page }) => {
  await page.goto('/marketplace');
  const first = page.getByTestId('save-listing').first();
  const title = (await first.getAttribute('aria-label'))!.replace(/^Save /, '');
  await first.click();
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/saved');
  await expect(page.getByTestId('listing-card').filter({ hasText: title })).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('listing-card').filter({ hasText: title })).toBeVisible();
  await page.getByTestId('save-listing').first().click();
  await expect(page.getByText('No saved phones yet')).toBeVisible();
});

test('FEAT-07 help centre lists answers and the WhatsApp contact', async ({ page }) => {
  await page.goto('/help');
  await page.getByText('Why can’t I share my number in chat?').click();
  await expect(page.getByText(/phone numbers, email addresses and outside chat links are blocked/)).toBeVisible();
  await expect(page.getByRole('link', { name: /WhatsApp our team/ })).toHaveAttribute('href', /wa\.me\/923174351383/);
});

test('FEAT-08 PTA Status opens the official PTA DIRBS site in a new tab @responsive', async ({ page }) => {
  await page.goto('/');
  if ((page.viewportSize()?.width ?? 1440) < 768) await page.getByRole('button', { name: 'Open menu' }).click();
  const link = page.locator('header').getByRole('link', { name: /^PTA Status/ }).filter({ visible: true });
  await expect(link).toHaveCount(1);
  await expect(link).toHaveAttribute('href', 'https://dirbs.pta.gov.pk/');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /noopener/);
  await expect(link).toContainText('PTA Status');
  // Clicking opens a new tab and leaves MobCheck open (the PTA site itself is not loaded in tests).
  await page.context().route('https://dirbs.pta.gov.pk/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>PTA</title>' }));
  const [popup] = await Promise.all([page.context().waitForEvent('page'), link.click()]);
  await expect(popup).toHaveURL('https://dirbs.pta.gov.pk/');
  await expect(page).toHaveURL(/localhost:3100\/$/);
  await popup.close();
});

test('FEAT-09 Phones menu groups brands, budgets and condition; the home page shows one search at a time', async ({ page }) => {
  await page.goto('/');
  // Hero search is the only visible search at the top of the home page.
  await expect(page.getByRole('searchbox', { name: 'Search MobCheck' })).toBeHidden();
  await expect(page.getByLabel('Search phones')).toBeVisible();
  await page.mouse.wheel(0, 900);
  await expect(page.getByRole('searchbox', { name: 'Search MobCheck' })).toBeVisible();

  const nav = page.getByRole('navigation', { name: 'Categories' });
  await nav.getByRole('button', { name: 'Phones' }).click();
  const menu = page.getByTestId('phones-menu');
  await expect(menu).toBeVisible();
  for (const heading of ['Brands', 'Budget', 'Condition']) await expect(menu.getByText(heading, { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(nav.getByRole('button', { name: 'Phones' })).toBeFocused();

  await nav.getByRole('button', { name: 'Phones' }).click();
  await menu.getByRole('link', { name: 'Under Rs 50,000' }).click();
  await expect(page).toHaveURL(/\/marketplace\?maxPrice=50000/);
  await expect(menu).toBeHidden();

  // Other pages keep the header search.
  await page.goto('/shops');
  await expect(page.getByRole('searchbox', { name: 'Search MobCheck' })).toBeVisible();
});

test('FEAT-10 footer links lead to real pages on every screen size @responsive', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByTestId('site-footer');
  const hrefs = await footer.locator('a[href^="/"]').evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute('href')!.split('#')[0]))]);
  expect(hrefs).toEqual(expect.arrayContaining(['/about', '/terms', '/privacy', '/refunds', '/help']));
  for (const href of hrefs) expect((await page.request.get(href)).status(), href).toBeLessThan(400);
  await expect(footer.getByRole('link', { name: /WhatsApp \+92 317 4351383/ })).toHaveAttribute('href', /wa\.me\/923174351383/);
  await expect(footer.getByText(/not affiliated with or endorsed by PTA/)).toBeVisible();

  for (const [path, heading] of [['/about', 'About MobCheck'], ['/terms', 'Terms of use'], ['/privacy', 'Privacy policy'], ['/refunds', 'Refunds and cancellations']]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path + ' should not scroll sideways').toBeLessThanOrEqual(1);
  }
  await expect(page.getByText(/Rs 1,000 inspection fee/)).toBeVisible();
});
