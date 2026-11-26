import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { InspectionBookingSchema } from '@/lib/validation';
import { verifyJWT, getAuthToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify auth
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const validation = InspectionBookingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { brandId, modelId, deviceType, shopId, inspectionDate, locationLatitude, locationLongitude } = validation.data;

    // Verify shop exists and is verified
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: { subscriptions: { select: { status: true } } },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    if (shop.status !== 'VERIFIED') {
      return NextResponse.json({ error: 'Shop is not verified' }, { status: 403 });
    }

    const inspectionFeePkr = 1000; // Default, can be made configurable

    // Create booking
    const booking = await prisma.inspectionBooking.create({
      data: {
        customerId: payload.userId,
        shopId,
        brandId,
        modelId,
        deviceType,
        inspectionDate: new Date(inspectionDate),
        status: 'AWAITING_PAYMENT',
        inspectionFeePkr,
        locationLatitude: locationLatitude ? parseFloat(locationLatitude.toString()) : null,
        locationLongitude: locationLongitude ? parseFloat(locationLongitude.toString()) : null,
      },
      include: {
        brand: { select: { name: true } },
        model: { select: { name: true } },
        shop: { select: { name: true, city: true } },
      },
    });

    return NextResponse.json(
      {
        message: 'Inspection booking created. Proceed to payment.',
        data: booking,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Book inspection error:', error);
    return NextResponse.json(
      { error: 'Failed to book inspection' },
      { status: 500 }
    );
  }
}
