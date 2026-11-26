import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const city = url.searchParams.get('city');
    const area = url.searchParams.get('area');

    const skip = (page - 1) * limit;

    const where: any = {
      status: 'VERIFIED',
    };

    if (city) where.city = city;
    if (area) where.area = area;

    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        where,
        include: {
          services: { select: { name: true, pricePkr: true } },
          subscriptions: { select: { status: true } },
          _count: { select: { reviews: true, inspectionBookings: true } },
        },
        skip,
        take: limit,
        orderBy: { averageRating: 'desc' },
      }),
      prisma.shop.count({ where }),
    ]);

    return NextResponse.json(
      {
        message: 'Shops retrieved successfully',
        data: shops,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get shops error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve shops' },
      { status: 500 }
    );
  }
}
