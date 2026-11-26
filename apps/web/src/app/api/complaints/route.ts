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
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { shopId, bookingId, category, description, evidenceUrls } = await request.json();

    // Validate input
    if (!shopId || !category || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create complaint
    const complaint = await prisma.complaint.create({
      data: {
        shopId,
        customerId: payload.userId,
        bookingId: bookingId || undefined,
        category,
        description,
        evidenceUrls: evidenceUrls || [],
        status: 'SUBMITTED',
      },
    });

    // Create admin action log
    await prisma.adminAction.create({
      data: {
        adminId: payload.userId,
        actionType: 'OTHER',
        entityType: 'complaint',
        entityId: complaint.id,
        description: `Complaint submitted against shop: ${category}`,
      },
    });

    return NextResponse.json(
      {
        message: 'Complaint submitted successfully',
        data: complaint,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create complaint error:', error);
    return NextResponse.json(
      { error: 'Failed to create complaint' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || !['SUPER_ADMIN', 'OPS_ADMIN', 'SUPPORT'].includes(payload.role)) {
      return NextResponse.json(
        { error: 'Admin/Support access required' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        include: {
          shop: { select: { name: true, city: true } },
          customer: { select: { firstName: true, lastName: true, email: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.complaint.count({ where }),
    ]);

    return NextResponse.json(
      {
        message: 'Complaints retrieved successfully',
        data: complaints,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get complaints error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve complaints' },
      { status: 500 }
    );
  }
}
