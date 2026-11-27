import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { InquirySchema } from '@/lib/validation';
import { parseBody, serverError } from '@/lib/api';
import { notify } from '@/lib/notify';
import { fullName } from '@/lib/format';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request);
    if (auth.response) return auth.response;
    if (!rateLimit(`inquiry:${auth.user.id}`, 20, 60 * 60 * 1000).ok) {
      return NextResponse.json({ error: 'You have sent a lot of messages. Try again later.' }, { status: 429 });
    }
    const parsed = await parseBody(request, InquirySchema);
    if (parsed.response) return parsed.response;

    const listing = await prisma.phoneListing.findUnique({ where: { id: params.id }, select: { id: true, userId: true, status: true, title: true } });
    if (!listing || listing.status !== 'ACTIVE') return NextResponse.json({ error: 'This listing is no longer available.' }, { status: 404 });
    if (listing.userId === auth.user.id) return NextResponse.json({ error: 'This is your own listing.' }, { status: 400 });

    const inquiry = await prisma.$transaction(async (tx) => {
      const created = await tx.listingInquiry.create({
        data: { listingId: listing.id, customerId: auth.user.id, message: parsed.data.message },
        select: { id: true, createdAt: true },
      });
      await tx.phoneListing.update({ where: { id: listing.id }, data: { inquiryCount: { increment: 1 } } });
      return created;
    });
    await notify(
      listing.userId,
      `New message about "${listing.title}"`,
      `${fullName(auth.user)}: ${parsed.data.message.slice(0, 140)}`,
      `/dashboard/listings/${listing.id}`
    );
    return NextResponse.json({ data: inquiry }, { status: 201 });
  } catch (error) {
    return serverError('Create inquiry error', error, 'Could not send your message.');
  }
}
