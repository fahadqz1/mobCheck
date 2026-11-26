import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJWT, getAuthToken } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { bookingId } = await request.json();

    // Get booking
    const booking = await prisma.inspectionBooking.findUnique({
      where: { id: bookingId },
      include: { shop: true },
    });

    if (!booking || booking.customerId !== payload.userId) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status !== 'AWAITING_PAYMENT') {
      return NextResponse.json({ error: 'Booking not awaiting payment' }, { status: 400 });
    }

    // Calculate amounts
    const gatewayFeePkr = Math.round(booking.inspectionFeePkr * 0.02); // 2% gateway fee
    const netAmountPkr = booking.inspectionFeePkr - gatewayFeePkr;

    // Generate idempotency key
    const idempotencyKey = crypto.randomUUID();

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        customerId: payload.userId,
        bookingId,
        amountPkr: booking.inspectionFeePkr,
        gatewayFeePkr,
        netAmountPkr,
        gateway: 'safepay',
        status: 'PENDING',
        idempotencyKey,
      },
    });

    // In production, integrate with actual payment gateway (Safepay, PayFast, etc.)
    // For now, return mock payment gateway redirect
    const paymentUrl = `https://sandbox-safepay.test/checkout?reference=${payment.id}&amount=${booking.inspectionFeePkr}`;

    return NextResponse.json(
      {
        message: 'Payment session created',
        data: {
          paymentId: payment.id,
          bookingId,
          amount: booking.inspectionFeePkr,
          currency: 'PKR',
          paymentUrl: process.env.NODE_ENV === 'production' ? paymentUrl : 'mock-payment-url',
          idempotencyKey,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
