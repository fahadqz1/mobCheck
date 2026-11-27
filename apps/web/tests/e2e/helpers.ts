import zlib from 'zlib';
import { expect, Page, APIRequestContext } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

// Tests only ever talk to the throwaway test database.
const TEST_DB = process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/mobcheck_test';
if (!/mobcheck_test/.test(TEST_DB)) throw new Error('Refusing to run tests against a non-test database');
export const db = new PrismaClient({ datasources: { db: { url: TEST_DB } } });

export const PASSWORD = 'Password123';
export const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto('/auth/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  // Dev servers compile routes on first hit, so allow for a cold start.
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 30_000 });
}

export async function apiLogin(request: APIRequestContext, email: string, password = PASSWORD) {
  const res = await request.post('/api/auth/login', { data: { email, password } });
  expect(res.ok(), await res.text()).toBeTruthy();
}

export async function logout(page: Page) {
  await page.request.post('/api/auth/logout');
}

export async function register(page: Page, opts: { role?: 'CUSTOMER' | 'SHOP_OWNER'; first?: string; phone?: string } = {}) {
  const email = `e2e-${uid()}@test.mobcheck.pk`;
  await page.goto(`/auth/register${opts.role === 'SHOP_OWNER' ? '?role=SHOP_OWNER' : ''}`);
  await page.getByLabel('First name').fill(opts.first || 'Test');
  await page.getByLabel('Last name').fill('User');
  await page.getByLabel('Email address').fill(email);
  if (opts.phone) await page.getByLabel('Mobile number').fill(opts.phone);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).not.toHaveURL(/\/auth\/register/, { timeout: 30_000 });
  return email;
}

// A valid solid-colour PNG, so uploads are real images without shipping fixture files.
export function png(r: number, g: number, b: number, size = 96) {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: size }, () => [r, g, b]).flat())]);
  const raw = Buffer.concat(Array.from({ length: size }, () => row));
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

export const photo = (name: string, rgb: [number, number, number]) => ({ name, mimeType: 'image/png', buffer: png(...rgb) });

export function nextWeekday(dayName: string, from = new Date()) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = new Date(from.getTime() + 86400000);
  while (days[d.getDay()] !== dayName) d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, 'page should not scroll horizontally').toBeLessThanOrEqual(1);
}
