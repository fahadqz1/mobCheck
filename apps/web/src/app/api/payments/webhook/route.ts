import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleGatewayEvent, verifySignature } from '@/lib/payments';
import { serverError } from '@/lib/api';

const EventSchema = z.object({
  eventId: z.string().min(1).max(100),
  event: z.enum(['payment.success', 'payment.failed']),
  paymentId: z.string().min(1),
  transactionId: z.string().max(100).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // The signature covers the exact bytes sent, so verify before parsing.
    const raw = await request.text();
    const signature = request.headers.get('x-webhook-signature');
    if (!verifySignature(raw, signature)) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    const parsed = EventSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    const { duplicate } = await handleGatewayEvent(parsed.data, raw, signature!);
    return NextResponse.json({ ok: true, duplicate });
  } catch (error) {
    return serverError('Webhook error', error, 'Webhook processing failed');
  }
}
