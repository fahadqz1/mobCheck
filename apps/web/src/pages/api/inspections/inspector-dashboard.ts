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
    if (!payload || payload.role !== 'INSPECTOR') {
      return NextResponse.json(
        { error: 'Only inspectors can access this' },
        { status: 403 }
      );
    }

    // Get inspector profile
    const inspector = await prisma.inspector.findUnique({
      where: { userId: payload.userId },
      include: { shop: { select: { name: true, city: true } } },
    });

    if (!inspector) {
      return NextResponse.json({ error: 'Inspector not found' }, { status: 404 });
    }

    // Get assigned inspections
    const [
      pendingInspections,
      inProgressInspections,
      completedInspections,
      allInspections,
    ] = await Promise.all([
      prisma.inspectionBooking.findMany({
        where: {
          inspectorId: inspector.id,
          status: 'INSPECTOR_ASSIGNED',
        },
        include: {
          customer: { select: { firstName: true, lastName: true, phone: true } },
          shop: { select: { name: true } },
          brand: { select: { name: true } },
          model: { select: { name: true } },
        },
        orderBy: { inspectionDate: 'asc' },
        take: 5,
      }),
      prisma.inspectionBooking.findMany({
        where: {
          inspectorId: inspector.id,
          status: 'INSPECTION_IN_PROGRESS',
        },
        include: {
          customer: { select: { firstName: true, lastName: true } },
          brand: { select: { name: true } },
          model: { select: { name: true } },
        },
      }),
      prisma.inspectionBooking.findMany({
        where: {
          inspectorId: inspector.id,
          status: 'COMPLETED',
        },
        take: 10,
      }),
      prisma.inspectionBooking.count({
        where: { inspectorId: inspector.id },
      }),
    ]);

    // Get performance metrics
    const reviews = await prisma.review.findMany({
      where: {
        booking: {
          inspectorId: inspector.id,
        },
      },
    });

    const averageRating =
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length).toFixed(1)
        : 0;

    return NextResponse.json(
      {
        message: 'Inspector dashboard data retrieved',
        data: {
          inspector: {
            name: `${inspector.user?.firstName} ${inspector.user?.lastName}`,
            shop: inspector.shop,
            status: inspector.status,
            verified: inspector.verified,
          },
          inspections: {
            pending: pendingInspections,
            inProgress: inProgressInspections,
            completed: completedInspections,
            total: allInspections,
          },
          performance: {
            totalInspections: inspector.totalInspections,
            completedInspections: inspector.completedInspections,
            averageRating: parseFloat(averageRating as string),
            reviewCount: reviews.length,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Inspector dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
