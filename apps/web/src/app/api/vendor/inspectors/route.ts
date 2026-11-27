import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { InspectorCreateSchema } from '@/lib/validation';
import { parseBody, serverError } from '@/lib/api';

// Readable temporary password: no ambiguous characters, always has a letter and a digit.
function tempPassword() {
  const letters = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const pick = (set: string, n: number) => Array.from(crypto.randomBytes(n), (b) => set[b % set.length]).join('');
  return `${pick(letters, 6)}-${pick(digits, 4)}`;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request, ['SHOP_OWNER']);
    if (auth.response) return auth.response;
    const parsed = await parseBody(request, InspectorCreateSchema);
    if (parsed.response) return parsed.response;
    const shop = await prisma.shop.findFirst({ where: { ownerId: auth.user.id }, select: { id: true } });
    if (!shop) return NextResponse.json({ error: 'Register your shop first.' }, { status: 404 });

    const { firstName, lastName, email, phone, ...availability } = parsed.data;
    if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
      return NextResponse.json({ error: 'Please correct the highlighted fields.', fields: { email: 'This email already has a MobCheck account' } }, { status: 409 });
    }
    const password = tempPassword();
    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        phone,
        role: 'INSPECTOR',
        status: 'ACTIVE',
        passwordHash: await bcrypt.hash(password, 12),
        inspectorProfile: { create: { shopId: shop.id, status: 'ACTIVE', ...availability } },
      },
      select: { id: true, email: true },
    });
    // The temporary password is returned once so the owner can hand it over; it is never stored in plain text.
    return NextResponse.json({ data: { email: user.email, temporaryPassword: password } }, { status: 201 });
  } catch (error) {
    return serverError('Create inspector error', error, 'Could not add the inspector.');
  }
}
