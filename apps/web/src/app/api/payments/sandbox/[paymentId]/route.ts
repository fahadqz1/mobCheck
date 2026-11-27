import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { handleGatewayEvent, signPayload } from '@/lib/payments';
import { serverError } from '@/lib/api';

// Stands in for a hosted payment page until a real gateway is connected. Never available in production.
export async function POST(request: NextRequest, { params }: { params: { paymentId: string } }) {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_SANDBOX_PAYMENTS !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  try {
    const auth = await requireUser(request);
    if (auth.response) return auth.response;
    const payment = await prisma.payment.findUnique({ where: { id: params.paymentId }, select: { id: true, customerId: true, status: true, bookingId: true } });
    if (!payment || payment.customerId !== auth.user.id) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    if (payment.status !== 'PENDING') return NextResponse.json({ error: 'This payment is no longer pending.' }, { status: 409 });

    const { outcome } = await request.json().catch(() => ({ outcome: '' }));
    if (outcome !== 'success' && outcome !== 'failure') return NextResponse.json({ error: 'Unknown outcome' }, { status: 400 });

    const event = {
      eventId: `sbx_${crypto.randomUUID()}`,
      event: outcome === 'success' ? ('payment.success' as const) : ('payment.failed' as const),
      paymentId: payment.id,
      transactionId: `SBX-${crypto.randomBytes(5).toString('hex').toUpperCase()}`,
    };
    const raw = JSON.stringify(event);
    await handleGatewayEvent(event, raw, signPayload(raw));
    return NextResponse.json({ ok: true, bookingId: payment.bookingId });
  } catch (error) {
    return serverError('Sandbox payment error', error, 'Payment could not be processed.');
  }
}
