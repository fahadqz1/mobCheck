import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-webhook-signature');

    // Verify webhook signature (use actual secret from payment provider)
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || 'dev-secret';
    const hash = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(body))
      .digest('hex');

    if (signature !== hash) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Log webhook
    await prisma.webhookLog.create({
      data: {
        webhookType: body.event,
        gateway: 'safepay',
        gatewayEventId: body.eventId,
        payload: JSON.stringify(body),
        signature: signature || '',
        signatureVerified: true,
      },
    });

    // Handle payment success
    if (body.event === 'payment.success') {
      const payment = await prisma.payment.findUnique({
        where: { id: body.paymentId },
      });

      if (payment) {
        // Update payment
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'SUCCESS',
            gatewayTransactionId: body.transactionId,
            webhookReceivedAt: new Date(),
            webhookVerified: true,
            processedAt: new Date(),
          },
        });

        // Update booking
        await prisma.inspectionBooking.update({
          where: { id: payment.bookingId },
          data: {
            status: 'PAYMENT_CONFIRMED',
            paymentId: payment.id,
          },
        });

        // Create payout ledger entry
        const booking = await prisma.inspectionBooking.findUnique({
          where: { id: payment.bookingId },
        });

        if (booking) {
          const mobcheckMarginPercentage = 20;
          const mobcheckMargin = Math.round(
            (payment.amountPkr * mobcheckMarginPercentage) / 100
          );
          const shopPayout = payment.amountPkr - payment.gatewayFeePkr - mobcheckMargin;

          await prisma.payoutLedger.create({
            data: {
              shopId: booking.shopId,
              bookingId: booking.id,
              grossInspectionFeePkr: payment.amountPkr,
              gatewayFeePkr: payment.gatewayFeePkr,
              mobcheckMarginPkr: mobcheckMargin,
              shopPayoutPkr: shopPayout,
              paymentConfirmed: true,
              paymentConfirmedAt: new Date(),
            },
          });
        }
      }
    }

    // Handle payment failure
    if (body.event === 'payment.failed') {
      const payment = await prisma.payment.findUnique({
        where: { id: body.paymentId },
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
          },
        });
      }
    }

    return NextResponse.json(
      { message: 'Webhook processed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
