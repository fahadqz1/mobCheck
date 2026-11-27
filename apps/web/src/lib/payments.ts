import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from './prisma';
import { processPaymentFailure, processPaymentSuccess } from './bookings';

export type GatewayEvent = { eventId: string; event: 'payment.success' | 'payment.failed'; paymentId: string; transactionId?: string };

export function webhookSecret() {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') throw new Error('PAYMENT_WEBHOOK_SECRET is not set');
  return secret || 'dev-only-webhook-secret';
}

export const signPayload = (raw: string) => crypto.createHmac('sha256', webhookSecret()).update(raw).digest('hex');

export function verifySignature(raw: string, signature: string | null) {
  if (!signature || !/^[a-f0-9]{64}$/.test(signature)) return false;
  return crypto.timingSafeEqual(Buffer.from(signPayload(raw), 'hex'), Buffer.from(signature, 'hex'));
}

// Gateways retry deliveries; the unique gatewayEventId makes repeated events a no-op.
export async function handleGatewayEvent(event: GatewayEvent, raw: string, signature: string) {
  try {
    await prisma.webhookLog.create({
      data: {
        webhookType: event.event === 'payment.success' ? 'PAYMENT_SUCCESS' : 'PAYMENT_FAILED',
        gateway: 'sandbox',
        gatewayEventId: event.eventId,
        payload: raw,
        signature,
        signatureVerified: true,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return { duplicate: true };
    throw e;
  }
  try {
    if (event.event === 'payment.success') await processPaymentSuccess(event.paymentId, event.transactionId || event.eventId);
    else await processPaymentFailure(event.paymentId);
    await prisma.webhookLog.update({ where: { gatewayEventId: event.eventId }, data: { processed: true, processedAt: new Date() } });
  } catch (error) {
    await prisma.webhookLog.update({ where: { gatewayEventId: event.eventId }, data: { processingError: String(error).slice(0, 500) } });
    throw error;
  }
  return { duplicate: false };
}
