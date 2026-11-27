import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        models: {
          select: {
            id: true,
            name: true,
            slug: true,
            releaseYear: true,
            os: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(
      {
        message: 'Brands retrieved successfully',
        data: brands,
        count: brands.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get brands error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve brands' },
      { status: 500 }
    );
  }
}
