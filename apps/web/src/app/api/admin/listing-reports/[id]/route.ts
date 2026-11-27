import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ADMIN_ROLES, requireUser } from '@/lib/session';
import { AdminListingReportSchema } from '@/lib/validation';
import { parseBody, serverError } from '@/lib/api';
import { notify } from '@/lib/notify';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request, ADMIN_ROLES);
    if (auth.response) return auth.response;
    const parsed = await parseBody(request, AdminListingReportSchema);
    if (parsed.response) return parsed.response;
    const report = await prisma.listingReport.findUnique({ where: { id: params.id }, include: { listing: { select: { id: true, userId: true, title: true } } } });
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      // Resolve every open report on the listing together so moderators don't re-review it.
      await tx.listingReport.updateMany({ where: { listingId: report.listingId, status: 'OPEN' }, data: { status: parsed.data.status, reviewedById: auth.user.id, reviewedAt: new Date() } });
      if (parsed.data.removeListing) await tx.phoneListing.update({ where: { id: report.listingId }, data: { status: 'REMOVED' } });
      await tx.adminAction.create({ data: { adminId: auth.user.id, actionType: 'OTHER', entityType: 'listing', entityId: report.listingId, description: `Listing reports ${parsed.data.status.toLowerCase()}${parsed.data.removeListing ? ', listing removed' : ''}` } });
    });
    if (parsed.data.removeListing) {
      await notify(report.listing.userId, 'Your listing was removed by MobCheck', `"${report.listing.title}" was reported and does not meet our listing rules.`, `/dashboard/listings/${report.listingId}`);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError('Admin listing report error', error);
  }
}
