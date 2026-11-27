import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ADMIN_ROLES, requireUser } from '@/lib/session';
import { ListingSchema, ListingStatusSchema } from '@/lib/validation';
import { parseBody, serverError } from '@/lib/api';
import { notify } from '@/lib/notify';

// PATCH with {status} changes availability; any other body edits the listing (owner only).
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request);
    if (auth.response) return auth.response;
    const listing = await prisma.phoneListing.findUnique({ where: { id: params.id }, select: { id: true, userId: true, title: true, status: true } });
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

    const isOwner = listing.userId === auth.user.id;
    const isAdmin = ADMIN_ROLES.includes(auth.user.role);
    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'You can only change your own listings.' }, { status: 403 });

    const raw = await request.clone().json().catch(() => ({}));
    if (raw && typeof raw === 'object' && 'status' in raw && Object.keys(raw).length === 1) {
      const parsed = await parseBody(request, ListingStatusSchema);
      if (parsed.response) return parsed.response;
      const updated = await prisma.phoneListing.update({ where: { id: listing.id }, data: { status: parsed.data.status }, select: { id: true, status: true } });
      if (isAdmin && !isOwner && parsed.data.status === 'REMOVED') {
        await notify(listing.userId, 'Your listing was removed by MobCheck', `"${listing.title}" no longer meets our listing rules. Contact support if you think this is a mistake.`, `/listings/${listing.id}`);
      }
      return NextResponse.json({ data: updated });
    }

    if (!isOwner) return NextResponse.json({ error: 'Only the seller can edit listing details.' }, { status: 403 });
    const parsed = await parseBody(request, ListingSchema);
    if (parsed.response) return parsed.response;
    const updated = await prisma.phoneListing.update({ where: { id: listing.id }, data: parsed.data, select: { id: true } });
    return NextResponse.json({ data: updated });
  } catch (error) {
    return serverError('Update listing error', error);
  }
}
