import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ReviewSchema } from '@/lib/validation';
import { verifyJWT, getAuthToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const shopId = url.searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json({ error: 'shopId required' }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: {
        shopId,
        status: 'PUBLISHED',
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            id: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const stats = {
      totalReviews: reviews.length,
      averageRating:
        reviews.length > 0
          ? (reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length).toFixed(1)
          : 0,
      ratingBreakdown: {
        five: reviews.filter((r) => r.overallRating === 5).length,
        four: reviews.filter((r) => r.overallRating === 4).length,
        three: reviews.filter((r) => r.overallRating === 3).length,
        two: reviews.filter((r) => r.overallRating === 2).length,
        one: reviews.filter((r) => r.overallRating === 1).length,
      },
    };

    return NextResponse.json(
      {
        message: 'Reviews retrieved successfully',
        data: reviews,
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve reviews' },
      { status: 500 }
    );
  }
}

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
    const validation = ReviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { bookingId, shopId } = body;

    // Verify booking exists and belongs to customer
    const booking = await prisma.inspectionBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.customerId !== payload.userId) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if already reviewed
    const existingReview = await prisma.review.findUnique({
      where: { bookingId },
    });

    if (existingReview) {
      return NextResponse.json({ error: 'Already reviewed' }, { status: 409 });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        ...validation.data,
        bookingId,
        shopId,
        customerId: payload.userId,
        status: 'PUBLISHED',
      },
    });

    // Update shop average rating
    const shopReviews = await prisma.review.findMany({
      where: { shopId, status: 'PUBLISHED' },
    });

    const avgRating = (
      shopReviews.reduce((sum, r) => sum + r.overallRating, 0) / shopReviews.length
    ).toFixed(1);

    await prisma.shop.update({
      where: { id: shopId },
      data: {
        averageRating: parseFloat(avgRating),
        totalReviews: shopReviews.length,
      },
    });

    return NextResponse.json(
      {
        message: 'Review submitted successfully',
        data: review,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
