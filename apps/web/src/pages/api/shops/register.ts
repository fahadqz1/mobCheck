import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ShopRegistrationSchema } from '@/lib/validation';
import { verifyJWT, getAuthToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify auth
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'SHOP_OWNER') {
      return NextResponse.json({ error: 'Only shop owners can register' }, { status: 403 });
    }

    const body = await request.json();
    const validation = ShopRegistrationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { name, email, phone, whatsapp, addressLine1, city, area, openingHour, closingHour } = validation.data;

    // Check if shop already exists for this owner
    const existingShop = await prisma.shop.findFirst({
      where: { ownerId: payload.userId },
    });

    if (existingShop) {
      return NextResponse.json(
        { error: 'You already have a registered shop' },
        { status: 409 }
      );
    }

    // Create shop
    const shop = await prisma.shop.create({
      data: {
        ownerId: payload.userId,
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        email,
        phone,
        whatsapp: whatsapp || phone,
        addressLine1,
        city,
        area,
        openingHour: openingHour || '09:00',
        closingHour: closingHour || '21:00',
        status: 'PENDING',
        trialStartsAt: new Date(),
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Create subscription record (trial)
    await prisma.shopSubscription.create({
      data: {
        shopId: shop.id,
        status: 'TRIAL',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        pricePkr: 1200,
        autoRenew: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Shop registered successfully. Awaiting admin verification.',
        data: shop,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Shop registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register shop' },
      { status: 500 }
    );
  }
}
