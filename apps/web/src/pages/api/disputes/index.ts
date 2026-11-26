import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJWT, getAuthToken } from '@/lib/auth';

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

    const { bookingId, reason } = await request.json();

    // Verify booking exists and belongs to customer
    const booking = await prisma.inspectionBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.customerId !== payload.userId) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if in review window
    if (!booking.reviewWindowExpiresAt || new Date() > booking.reviewWindowExpiresAt) {
      return NextResponse.json(
        { error: 'Review window has expired' },
        { status: 400 }
      );
    }

    // Update booking with dispute
    const updatedBooking = await prisma.inspectionBooking.update({
      where: { id: bookingId },
      data: {
        status: 'DISPUTE_RAISED',
        disputeReason: reason,
        disputeRaisedAt: new Date(),
      },
    });

    // Pause payout
    await prisma.payoutLedger.updateMany({
      where: { bookingId },
      data: { disputeActive: true },
    });

    return NextResponse.json(
      {
        message: 'Dispute raised. Admin will review within 48 hours.',
        data: updatedBooking,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create dispute error:', error);
    return NextResponse.json(
      { error: 'Failed to raise dispute' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || !['SUPER_ADMIN', 'OPS_ADMIN'].includes(payload.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const disputes = await prisma.inspectionBooking.findMany({
      where: { status: 'DISPUTE_RAISED' },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
        shop: { select: { name: true, city: true } },
        payment: { select: { amountPkr: true } },
      },
      orderBy: { disputeRaisedAt: 'asc' },
      take: 50,
    });

    return NextResponse.json(
      {
        message: 'Open disputes retrieved',
        data: disputes,
        count: disputes.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get disputes error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve disputes' },
      { status: 500 }
    );
  }
}
