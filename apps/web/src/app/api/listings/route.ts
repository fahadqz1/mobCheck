import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ListingSchema } from '@/lib/validation';
import { verifyJWT, getAuthToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const city = url.searchParams.get('city');
    const brand = url.searchParams.get('brand');
    const ptaStatus = url.searchParams.get('ptaStatus');

    const skip = (page - 1) * limit;

    const where: any = {
      status: 'ACTIVE',
    };

    if (city) where.locationCity = city;
    if (brand) where.brandId = brand;
    if (ptaStatus) where.ptaStatus = ptaStatus;

    const [listings, total] = await Promise.all([
      prisma.phoneListing.findMany({
        where,
        include: {
          brand: { select: { name: true, slug: true } },
          model: { select: { name: true, slug: true } },
          photos: { take: 1 },
          user: {
            select: {
              firstName: true,
              lastName: true,
              id: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.phoneListing.count({ where }),
    ]);

    return NextResponse.json(
      {
        message: 'Listings retrieved successfully',
        data: listings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get listings error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve listings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify auth
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = ListingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const listing = await prisma.phoneListing.create({
      data: {
        ...validation.data,
        userId: payload.userId,
        status: 'ACTIVE',
        listedAt: new Date(),
      },
      include: {
        brand: true,
        model: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Listing created successfully',
        data: listing,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create listing error:', error);
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}
