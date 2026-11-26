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
    if (!payload || !['SUPER_ADMIN', 'OPS_ADMIN'].includes(payload.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { shopId, approve } = await request.json();

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    if (approve) {
      await prisma.shop.update({
        where: { id: shopId },
        data: {
          status: 'VERIFIED',
          verifiedAt: new Date(),
          verifiedById: payload.userId,
        },
      });

      await prisma.adminAction.create({
        data: {
          adminId: payload.userId,
          actionType: 'SHOP_VERIFY',
          entityType: 'shop',
          entityId: shopId,
          description: `Shop "${shop.name}" verified`,
        },
      });

      return NextResponse.json(
        { message: 'Shop verified successfully', data: shop },
        { status: 200 }
      );
    } else {
      await prisma.shop.update({
        where: { id: shopId },
        data: { status: 'REJECTED' },
      });

      return NextResponse.json(
        { message: 'Shop rejected', data: shop },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Verify shop error:', error);
    return NextResponse.json(
      { error: 'Failed to verify shop' },
      { status: 500 }
    );
  }
}
