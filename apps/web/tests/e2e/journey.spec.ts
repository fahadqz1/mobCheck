import { test, expect, Page } from '@playwright/test';
import { db, login, logout, nextWeekday, photo, register, uid } from './helpers';

// One realistic lifecycle shared across steps; each step depends on the previous one.
test.describe.configure({ mode: 'serial', timeout: 150_000 });

const state: Record<string, string> = {};
const shopName = `E2E Phone Lab ${uid()}`;

async function bookAndPay(page: Page, date: string) {
  await page.goto(`/shops/${state.shopSlug}`);
  await page.getByRole('link', { name: 'Book inspection' }).first().click();
  await expect(page).toHaveURL(/\/bookings\/new\?shop=/);
  await page.getByLabel('Brand').selectOption({ label: 'Apple' });
  await page.getByLabel('Model').selectOption({ label: 'iPhone 15 Pro' });
  await page.getByLabel('Storage (GB)').fill('256');
  await page.getByLabel('Date').fill(date);
  await page.getByLabel('Time').selectOption('12:00');
  await page.getByRole('button', { name: 'Continue to payment' }).click();
  await expect(page).toHaveURL(/\/dashboard\/bookings\/[a-z0-9]+\?created=1/, { timeout: 30_000 });
  const bookingId = page.url().split('/').pop()!.split('?')[0];
  await page.getByRole('button', { name: /^Pay Rs/ }).click();
  await expect(page).toHaveURL(/\/checkout\//);
  await expect(page.getByTestId('checkout-total')).toHaveText('Rs 1,000');
  await page.getByRole('button', { name: /^Pay Rs/ }).click();
  await expect(page).toHaveURL(new RegExp(`/dashboard/bookings/${bookingId}\\?paid=1`), { timeout: 30_000 });
  await expect(page.getByText('Payment received')).toBeVisible();
  await expect(page.getByText('Awaiting shop', { exact: true })).toBeVisible();
  return bookingId;
}

test('J-01 seller lists a phone with photos and sees it live', async ({ page }) => {
  state.sellerEmail = await register(page, { first: 'Seller', phone: '0301 2345678' });
  await page.goto('/listings/new');
  await page.getByTestId('photo-input').setInputFiles([photo('front.png', [20, 120, 90]), photo('back.png', [200, 60, 40]), photo('side.png', [40, 40, 160])]);
  await page.getByLabel('Brand').selectOption({ label: 'Samsung' });
  await page.getByLabel('Model').selectOption({ label: 'Galaxy S24 Ultra' });
  await page.getByLabel('Storage (GB)').fill('512');
  await page.getByLabel('Colour').fill('Titanium Gray');
  await page.getByLabel('Overall condition').selectOption('EXCELLENT');
  await page.getByLabel('Battery health (%)').fill('91');
  await page.getByLabel('Repair history').fill('Back glass replaced in 2025');
  await page.getByLabel('Original box').check();
  await page.getByLabel('Asking price (Rs)').fill('289000');
  await page.getByLabel('Description').fill('Lightly used, always in a case.');
  await page.getByLabel('City').selectOption('Lahore');
  await page.getByLabel('Area').fill('Gulberg III');
  await page.getByRole('button', { name: 'Publish listing' }).click();
  await expect(page).toHaveURL(/\/listings\/[a-z0-9]+\?created=1/, { timeout: 45_000 });
  state.listingId = page.url().split('/').pop()!.split('?')[0];
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Galaxy S24 Ultra 512GB Titanium Gray');
  await expect(page.getByTestId('listing-price')).toHaveText('Rs 289,000');
  await expect(page.getByText('91% (seller stated)')).toBeVisible();
  await expect(page.getByText('Back glass replaced in 2025')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Manage listing' })).toBeVisible();
  expect(await db.listingPhoto.count({ where: { listingId: state.listingId } })).toBe(3);
});

test('J-02 buyer filters the marketplace and opens the listing gallery', async ({ page }) => {
  state.buyerEmail = await register(page, { first: 'Buyer', phone: '0333 7654321' });
  await page.goto('/marketplace');
  await page.getByLabel('Search phones').fill('S24 Ultra');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page).toHaveURL(/q=S24\+Ultra/);
  await page.getByLabel('City').first().selectOption('Lahore');
  await expect(page).toHaveURL(/city=Lahore/);
  const card = page.locator(`[data-testid="listing-card"][href="/listings/${state.listingId}"]`);
  await expect(card).toBeVisible();
  await page.reload();
  await expect(card, 'filters survive refresh').toBeVisible();
  await card.click();
  await expect(page).toHaveURL(new RegExp(`/listings/${state.listingId}`));

  const gallery = page.getByTestId('gallery');
  await expect(gallery.getByText('1 / 3')).toBeVisible();
  await gallery.getByRole('button', { name: 'Next photo' }).click();
  await expect(gallery.getByText('2 / 3')).toBeVisible();
  await gallery.getByRole('button', { name: 'Show photo 3' }).click();
  await expect(gallery.getByText('3 / 3')).toBeVisible();
  await gallery.getByRole('button', { name: 'View photos full screen' }).click();
  const viewer = page.getByRole('dialog', { name: 'Photo viewer' });
  await expect(viewer).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(viewer.getByText('1 / 3')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(viewer).toBeHidden();

  // The seller's phone number must never reach the page; buyers use in-app chat.
  await expect(page.getByRole('link', { name: /WhatsApp seller/ })).toHaveCount(0);
  expect(await page.content()).not.toContain('2345678');
  await expect(page.getByRole('heading', { name: 'Similar phones' })).toBeVisible();
});

test('J-03 buyer chats with and reports the listing; seller sees the message', async ({ page }) => {
  await login(page, state.buyerEmail);
  await page.goto(`/listings/${state.listingId}`);
  await page.getByRole('button', { name: 'Chat with seller' }).click();
  await expect(page).toHaveURL(/\/messages\?c=/, { timeout: 30_000 });
  await page.getByLabel('Message', { exact: true }).fill('Is the price negotiable? I can meet in Gulberg this week.');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByText('Is the price negotiable?')).toBeVisible();
  await page.goto(`/listings/${state.listingId}`);
  await page.getByRole('button', { name: 'Report this listing' }).click();
  await page.getByLabel('Reason').selectOption('WRONG_PRICE');
  await page.getByRole('button', { name: 'Submit report' }).click();
  await expect(page.getByTestId('toast').filter({ hasText: 'Thanks. Our team will review this listing.' })).toBeVisible();
  await logout(page);

  await login(page, state.sellerEmail);
  await page.goto('/dashboard');
  await expect(page.getByTestId('messages-unread')).toHaveText('1');
  await page.goto('/messages');
  await page.getByRole('link', { name: /Buyer U\./ }).click();
  await expect(page.getByText('Is the price negotiable?')).toBeVisible();
});

test('J-04 shop owner registers a shop; it stays hidden until verified', async ({ page }) => {
  state.ownerEmail = await register(page, { role: 'SHOP_OWNER', first: 'Owner' });
  await expect(page).toHaveURL(/\/vendor\/shop/);
  await page.getByLabel('Shop name').fill(shopName);
  await page.getByLabel('Description').fill('Apple and Samsung specialists with ten years in Hafeez Centre.');
  await page.getByLabel('Phone').fill('0300 1112233');
  await page.getByLabel(/^Address\*?$/).fill('Shop 41, Second Floor');
  await page.getByLabel('City').selectOption('Lahore');
  await page.getByLabel('Market / area').fill('Hafeez Centre');
  await page.getByLabel('Sunday').check();
  await page.getByRole('button', { name: 'Register shop' }).click();
  await expect(page.getByText('Verification in progress')).toBeVisible({ timeout: 30_000 });
  const shop = await db.shop.findFirstOrThrow({ where: { name: shopName } });
  state.shopId = shop.id;
  state.shopSlug = shop.slug;
  await logout(page);
  const res = await page.goto(`/shops/${state.shopSlug}`);
  expect(res?.status()).toBe(404);
});

test('J-05 admin verifies the shop', async ({ page }) => {
  await login(page, 'admin@mobcheck.pk');
  await page.goto('/admin/shops');
  await page.getByRole('link', { name: shopName }).click();
  await page.getByRole('button', { name: 'Verify shop' }).click();
  await expect(page.getByTestId('toast').filter({ hasText: 'Shop verified' })).toBeVisible();
  await expect(page.getByText('Verified', { exact: true }).first()).toBeVisible();
});

test('J-06 owner adds branding, a service and an inspector', async ({ page }) => {
  await login(page, state.ownerEmail);
  await page.goto('/vendor/shop');
  await page.getByLabel('Upload Logo').setInputFiles(photo('logo.png', [4, 114, 88]));
  await expect(page.getByRole('img', { name: 'Logo' })).toBeVisible({ timeout: 20_000 });

  await page.goto('/vendor/services');
  await page.getByRole('button', { name: 'Add service' }).first().click();
  await page.getByLabel('Service name').fill('iPhone battery replacement');
  await page.getByLabel('Price (Rs)').fill('9500');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('iPhone battery replacement')).toBeVisible();

  await page.goto('/vendor/inspectors');
  await page.getByRole('button', { name: 'Add inspector' }).first().click();
  state.inspectorEmail = `inspector-${uid()}@test.mobcheck.pk`;
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('First name').fill('Imran');
  await dialog.getByLabel('Last name').fill('Inspector');
  await dialog.getByLabel('Email').fill(state.inspectorEmail);
  await dialog.getByRole('button', { name: 'Add inspector' }).click();
  state.inspectorPassword = (await page.getByTestId('temp-password').innerText()).trim();
  expect(state.inspectorPassword).toMatch(/^[a-z]{6}-\d{4}$/);
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByText('Imran Inspector')).toBeVisible();

  await logout(page);
  await page.goto(`/shops/${state.shopSlug}`);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(shopName);
  await expect(page.getByText('Verified by MobCheck', { exact: true })).toBeVisible();
  await expect(page.getByText('iPhone battery replacement')).toBeVisible();
  await expect(page.getByText('1 active inspector')).toBeVisible();
});

test('J-07 buyer books and pays; slot validation rejects a closed day', async ({ page }) => {
  await login(page, state.buyerEmail);
  // The shop is closed on Sundays.
  await page.goto(`/bookings/new?shop=${state.shopSlug}`);
  await page.getByLabel('Brand').selectOption({ label: 'Apple' });
  await page.getByLabel('Model').selectOption({ label: 'iPhone 15 Pro' });
  await page.getByLabel('Date').fill(nextWeekday('Sunday'));
  await page.getByLabel('Time').selectOption('12:00');
  await page.getByRole('button', { name: 'Continue to payment' }).click();
  await expect(page.getByText('The shop is closed on Sundays').first()).toBeVisible();

  state.bookingId = await bookAndPay(page, nextWeekday('Monday'));
});

test('J-08 shop accepts and assigns the inspector', async ({ page }) => {
  await login(page, state.ownerEmail);
  await page.goto('/vendor/bookings');
  await page.locator(`a[href="/vendor/bookings/${state.bookingId}"]`).click();
  await expect(page.getByText('Buyer User')).toBeVisible();
  // Shops talk to customers through chat; the customer's phone stays private.
  await expect(page.getByText('0333 7654321')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Message the customer' })).toBeVisible();
  await page.getByRole('button', { name: 'Accept booking' }).click();
  await expect(page.getByTestId('toast').filter({ hasText: 'Booking accepted' })).toBeVisible();
  await page.getByLabel('Inspector').selectOption({ label: 'Imran Inspector' });
  await page.getByRole('button', { name: 'Assign inspector' }).click();
  // Wait for the save itself: 'Inspector assigned' is also a step name on the booking timeline.
  await expect(page.getByTestId('toast').filter({ hasText: 'Inspector assigned' })).toBeVisible({ timeout: 30_000 });
});

test('J-09 inspector completes the checklist with photos and issues the report', async ({ page }) => {
  await login(page, state.inspectorEmail, state.inspectorPassword);
  await page.goto('/inspector');
  await page.locator(`a[href="/inspector/bookings/${state.bookingId}"]`).click();
  await page.getByRole('button', { name: 'Start inspection' }).click();
  await expect(page.getByTestId('toast').filter({ hasText: 'Inspection started' })).toBeVisible();

  const results = page.getByRole('combobox', { name: /^Result for / });
  const count = await results.count();
  expect(count).toBeGreaterThan(20);
  for (let i = 0; i < count; i++) await results.nth(i).selectOption(i === 2 ? 'NEEDS_ATTENTION' : 'PASS');
  await page.getByLabel('Notes for Frame').fill('Minor scuff on the top edge');

  await expect(page.getByRole('button', { name: 'Submit inspection' })).toBeDisabled();
  await page.getByLabel('Photo type').selectOption('FRAME_DENT');
  await page.getByLabel('Photo caption').fill('Scuff, top edge');
  await page.getByTestId('evidence-input').setInputFiles(photo('scuff.png', [120, 120, 120]));
  await expect(page.getByAltText('Scuff, top edge')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('evidence-input').setInputFiles(photo('front.png', [10, 10, 10]));
  await expect(page.getByRole('button', { name: 'Remove photo 2' })).toBeVisible({ timeout: 20_000 });

  await page.reload();
  await expect(results.nth(2), 'draft survives refresh').toHaveValue('NEEDS_ATTENTION');

  await page.getByRole('button', { name: 'Submit inspection' }).click();
  await expect(page.getByTestId('toast').filter({ hasText: 'Inspection submitted' })).toBeVisible();
  await page.getByRole('button', { name: 'Generate report' }).click();
  await expect(page.getByTestId('toast').filter({ hasText: 'Report sent to the customer' })).toBeVisible();
  const report = await db.inspectionReport.findUniqueOrThrow({ where: { bookingId: state.bookingId } });
  state.reportNumber = report.reportNumber;
  expect(report.overallAssessment).toBe('FAIR');
});

test('J-10 buyer reads the report, confirms it and reviews the shop', async ({ page }) => {
  await login(page, state.buyerEmail);
  await page.goto('/dashboard');
  await page.getByRole('button', { name: /Notifications, \d+ unread/ }).click();
  await page.getByRole('menuitem', { name: /Your inspection report is ready/ }).click();
  await expect(page).toHaveURL(new RegExp(`/dashboard/bookings/${state.bookingId}`));
  await expect(page.getByText('Overall: Fair')).toBeVisible();
  await expect(page.getByText('Minor scuff on the top edge')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Photo evidence' })).toBeVisible();

  await page.getByRole('button', { name: 'Confirm report' }).click();
  await expect(page.getByTestId('toast').filter({ hasText: 'Thanks for confirming' })).toBeVisible();
  await expect(page.getByText('Completed', { exact: true }).first()).toBeVisible();

  await page.getByRole('radio', { name: '5 stars' }).click();
  await page.getByLabel('Your review').fill('Thorough inspection, explained every finding.');
  await page.getByRole('button', { name: 'Publish review' }).click();
  await expect(page.getByTestId('toast').filter({ hasText: 'Review published' })).toBeVisible();

  await page.goto(`/shops/${state.shopSlug}`);
  await expect(page.getByText('Thorough inspection, explained every finding.')).toBeVisible();
  await expect(page.getByText('(1)').first()).toBeVisible();
});

test('J-11 anyone can verify the report; private details stay hidden', async ({ page }) => {
  await page.goto('/verify');
  await page.getByLabel('Report number').fill('not-a-number');
  await page.getByRole('button', { name: 'Verify report' }).click();
  await expect(page.getByText('Enter the number exactly as printed')).toBeVisible();
  await page.getByLabel('Report number').fill(state.reportNumber.toLowerCase());
  await page.getByRole('button', { name: 'Verify report' }).click();
  await expect(page.getByText('Authentic MobCheck report.')).toBeVisible();
  await expect(page.getByText('Apple iPhone 15 Pro · 256 GB')).toBeVisible();
  await expect(page.getByRole('img', { name: /QR code/ })).toBeVisible();
  await expect(page.getByText('Buyer User')).toHaveCount(0);
  const missing = await page.goto('/reports/MC-2026-00000000');
  expect(missing?.status()).toBe(404);
});

test('J-12 dispute path: admin refunds and marks the refund paid', async ({ page }) => {
  await login(page, state.buyerEmail);
  const second = await bookAndPay(page, nextWeekday('Tuesday'));
  await logout(page);

  await login(page, state.ownerEmail);
  await page.goto(`/vendor/bookings/${second}`);
  await page.getByRole('button', { name: 'Accept booking' }).click();
  await page.getByLabel('Inspector').selectOption({ label: 'Imran Inspector' });
  await page.getByRole('button', { name: 'Assign inspector' }).click();
  await expect(page.getByText('Inspector assigned', { exact: true }).first()).toBeVisible();
  await logout(page);

  // Move straight to a delivered report through the API to keep the dispute test focused.
  await login(page, state.inspectorEmail, state.inspectorPassword);
  await page.request.post(`/api/bookings/${second}/actions`, { data: { action: 'start' } });
  await page.request.post(`/api/bookings/${second}/evidence`, { multipart: { file: photo('x.png', [1, 2, 3]) } });
  const items = await db.inspectionChecklist.findMany({ where: { deviceType: 'IPHONE', status: 'ACTIVE' } });
  const submit = await page.request.post(`/api/bookings/${second}/actions`, { data: { action: 'submit', results: items.map((c) => ({ checklistId: c.id, result: 'PASS' })) } });
  expect(submit.ok(), await submit.text()).toBeTruthy();
  expect((await page.request.post(`/api/bookings/${second}/actions`, { data: { action: 'generate_report' } })).ok()).toBeTruthy();
  await logout(page);

  await login(page, state.buyerEmail);
  await page.goto(`/dashboard/bookings/${second}`);
  await page.getByRole('button', { name: 'Raise a dispute' }).click();
  await page.getByLabel('What is wrong with the report?').fill('The report says the battery passed but the phone shuts down at 30%.');
  await page.getByRole('button', { name: 'Submit dispute' }).click();
  await expect(page.getByText('Dispute under review')).toBeVisible();
  await logout(page);

  await login(page, 'admin@mobcheck.pk');
  await page.goto('/admin/bookings');
  await page.locator(`a[href="/admin/bookings/${second}"]`).click();
  await page.getByLabel('Resolution note').fill('Battery fault confirmed on re-test.');
  await page.getByRole('button', { name: 'Refund the customer' }).click();
  await expect(page.getByTestId('toast').filter({ hasText: 'Refund issued' })).toBeVisible();
  await page.getByRole('button', { name: 'Mark refund as paid' }).click();
  await expect(page.getByText('Refund paid')).toBeVisible();
  const payment = await db.payment.findUniqueOrThrow({ where: { bookingId: second } });
  expect(payment.status).toBe('REFUNDED');
});

test('J-13 shop declines a booking and the buyer is refunded', async ({ page }) => {
  await login(page, state.buyerEmail);
  const third = await bookAndPay(page, nextWeekday('Wednesday'));
  await logout(page);
  await login(page, state.ownerEmail);
  await page.goto(`/vendor/bookings/${third}`);
  await page.getByRole('button', { name: 'Decline' }).click();
  await page.getByLabel('Reason').fill('Fully booked at that time, please choose another slot.');
  await page.getByRole('button', { name: 'Decline booking' }).click();
  await expect(page.getByTestId('toast').filter({ hasText: 'Booking declined' })).toBeVisible();
  const refunds = await db.refund.findMany({ where: { bookingId: third } });
  expect(refunds).toHaveLength(1);
});

test('J-14 complaint is filed by the buyer and resolved by admin', async ({ page }) => {
  await login(page, state.buyerEmail);
  await page.goto(`/dashboard/bookings/${state.bookingId}`);
  await page.getByRole('button', { name: 'Report a problem with this shop' }).click();
  await page.getByLabel('What went wrong?').selectOption('POOR_QUALITY');
  await page.getByLabel('Details').fill('The inspector arrived thirty minutes late without telling me.');
  await page.getByRole('button', { name: 'Submit complaint' }).click();
  await expect(page.getByTestId('toast').filter({ hasText: 'Complaint submitted' })).toBeVisible();
  await logout(page);

  await login(page, 'admin@mobcheck.pk');
  await page.goto('/admin/complaints');
  await page.getByRole('row', { name: new RegExp(shopName) }).getByRole('link').click();
  await page.getByLabel('Status').selectOption('RESOLVED');
  await page.getByLabel('Action against shop').selectOption('WARNING');
  await page.getByLabel('Resolution note').fill('Shop warned about punctuality.');
  await page.getByRole('button', { name: 'Save decision' }).click();
  await expect(page.getByTestId('toast').filter({ hasText: 'Complaint updated' })).toBeVisible();
});

test('J-15 admin removes the reported listing and suspends then reactivates a user', async ({ page }) => {
  await login(page, 'admin@mobcheck.pk');
  await page.goto('/admin/listings');
  const row = page.getByRole('row').filter({ has: page.locator(`a[href="/listings/${state.listingId}"]`) });
  await expect(row.getByText('Wrong price')).toBeVisible();
  await row.getByRole('button', { name: 'Remove' }).click();
  await expect(page.getByTestId('toast').filter({ hasText: 'Listing removed' })).toBeVisible();
  await logout(page);
  const res = await page.goto(`/listings/${state.listingId}`);
  expect(res?.status()).toBe(404);

  await login(page, 'admin@mobcheck.pk');
  await page.goto(`/admin/users?q=${encodeURIComponent(state.sellerEmail)}`);
  await page.getByRole('button', { name: 'Suspend' }).click();
  await expect(page.getByTestId('toast').filter({ hasText: 'User suspended and signed out' })).toBeVisible();
  await logout(page);
  await page.goto('/auth/login');
  await page.getByLabel('Email address').fill(state.sellerEmail);
  await page.getByLabel('Password').fill('Password123');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByText('This account is not active')).toBeVisible();

  await login(page, 'admin@mobcheck.pk');
  await page.goto(`/admin/users?q=${encodeURIComponent(state.sellerEmail)}`);
  await page.getByRole('button', { name: 'Reactivate' }).click();
  await expect(page.getByTestId('toast').filter({ hasText: 'User reactivated' })).toBeVisible();
});

test('J-16 admin dashboard and payments reflect real activity', async ({ page }) => {
  await login(page, 'admin@mobcheck.pk');
  await page.goto('/dashboard');
  await expect(page.getByText('Paid revenue')).toBeVisible();
  await page.goto('/admin/payments?status=REFUNDED');
  await expect(page.getByRole('row').filter({ hasText: 'Buyer User' }).first()).toBeVisible();
  await page.goto('/vendor/reviews');
  await expect(page).toHaveURL(/denied=1/);
});
