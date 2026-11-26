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
    if (!payload || payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Super admin access required' },
        { status: 403 }
      );
    }

    const { shopId, banType, reason, suspendedUntil } = await request.json();

    if (!shopId || !banType || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create ban record
    const ban = await prisma.shopBan.create({
      data: {
        shopId,
        banType,
        reason,
        bannedById: payload.userId,
        bannedAt: new Date(),
        suspendedUntil: banType === 'TEMPORARY_SUSPENSION'
          ? new Date(suspendedUntil)
          : null,
      },
    });

    // Update shop status
    await prisma.shop.update({
      where: { id: shopId },
      data: {
        status: banType === 'PERMANENT_BAN' ? 'BLOCKED' : 'SUSPENDED',
      },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: payload.userId,
        actionType: banType === 'PERMANENT_BAN' ? 'SHOP_BAN' : 'SHOP_SUSPEND',
        entityType: 'shop',
        entityId: shopId,
        description: `Shop ${banType === 'PERMANENT_BAN' ? 'permanently banned' : 'temporarily suspended'}: ${reason}`,
      },
    });

    return NextResponse.json(
      {
        message: `Shop ${banType === 'PERMANENT_BAN' ? 'banned' : 'suspended'} successfully`,
        data: ban,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Suspend shop error:', error);
    return NextResponse.json(
      { error: 'Failed to suspend shop' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Super admin access required' },
        { status: 403 }
      );
    }

    const { shopId } = await request.json();

    // Find active ban
    const activeBan = await prisma.shopBan.findFirst({
      where: { shopId },
      orderBy: { bannedAt: 'desc' },
    });

    if (!activeBan) {
      return NextResponse.json({ error: 'No active ban found' }, { status: 404 });
    }

    // Update shop status back to verified
    await prisma.shop.update({
      where: { id: shopId },
      data: { status: 'VERIFIED' },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: payload.userId,
        actionType: 'SHOP_VERIFY',
        entityType: 'shop',
        entityId: shopId,
        description: 'Shop suspension lifted',
      },
    });

    return NextResponse.json(
      {
        message: 'Shop suspension lifted',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unsuspend shop error:', error);
    return NextResponse.json(
      { error: 'Failed to lift suspension' },
      { status: 500 }
    );
  }
}
