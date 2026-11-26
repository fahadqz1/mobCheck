import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJWT, getAuthToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || !['SUPER_ADMIN', 'OPS_ADMIN'].includes(payload.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get metrics
    const [
      totalCustomers,
      totalShops,
      verifiedShops,
      activeListings,
      totalInspections,
      completedInspections,
      totalPayments,
      pendingPayouts,
      pendingShopVerifications,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.shop.count(),
      prisma.shop.count({ where: { status: 'VERIFIED' } }),
      prisma.phoneListing.count({ where: { status: 'ACTIVE' } }),
      prisma.inspectionBooking.count(),
      prisma.inspectionBooking.count({ where: { status: 'COMPLETED' } }),
      prisma.payment.count({ where: { status: 'SUCCESS' } }),
      prisma.payoutLedger.count({ where: { payoutStatus: 'PENDING' } }),
      prisma.shop.count({ where: { status: 'PENDING' } }),
    ]);

    const totalRevenue = await prisma.payment.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amountPkr: true },
    });

    return NextResponse.json(
      {
        message: 'Dashboard metrics retrieved',
        data: {
          customers: totalCustomers,
          shops: {
            total: totalShops,
            verified: verifiedShops,
            pendingVerification: pendingShopVerifications,
          },
          listings: activeListings,
          inspections: {
            total: totalInspections,
            completed: completedInspections,
          },
          payments: {
            total: totalPayments,
            revenue: totalRevenue._sum.amountPkr || 0,
          },
          payouts: {
            pending: pendingPayouts,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
