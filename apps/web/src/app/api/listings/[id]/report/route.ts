import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { ListingReportSchema } from '@/lib/validation';
import { parseBody, serverError } from '@/lib/api';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request);
    if (auth.response) return auth.response;
    const parsed = await parseBody(request, ListingReportSchema);
    if (parsed.response) return parsed.response;

    const listing = await prisma.phoneListing.findUnique({ where: { id: params.id }, select: { id: true, userId: true } });
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    if (listing.userId === auth.user.id) return NextResponse.json({ error: 'You cannot report your own listing.' }, { status: 400 });

    await prisma.listingReport.create({ data: { listingId: listing.id, reporterId: auth.user.id, ...parsed.data } });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'You have already reported this listing. Our team is reviewing it.' }, { status: 409 });
    }
    return serverError('Report listing error', error);
  }
}
