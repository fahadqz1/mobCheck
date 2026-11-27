import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { serverError, fieldErrors } from '@/lib/api';
import { completeBooking, createRefund, generateReport, loadBookingFor, transition, TransitionError, type Party } from '@/lib/bookings';
import { notify, notifyMany } from '@/lib/notify';
import { AdminBookingActionSchema, DisputeSchema, InspectionResultsSchema, ReviewSchema, ShopBookingActionSchema } from '@/lib/validation';
import { ZodTypeAny } from 'zod';

const GATEWAY_FEE_RATE = 0.02;

const ACTIONS: Record<string, Party[]> = {
  pay: ['customer'],
  cancel: ['customer'],
  confirm: ['customer'],
  dispute: ['customer'],
  review: ['customer'],
  accept: ['shop'],
  reject: ['shop'],
  assign: ['shop'],
  start: ['inspector'],
  submit: ['inspector'],
  generate_report: ['inspector', 'admin'],
  release: ['admin'],
  refund: ['admin'],
  mark_refunded: ['admin'],
};

function parse<S extends ZodTypeAny>(schema: S, body: unknown) {
  const r = schema.safeParse(body);
  if (!r.success) throw Object.assign(new TransitionError('Please correct the highlighted fields.', 400), { fields: fieldErrors(r.error) });
  return r.data as import('zod').z.output<S>;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request);
    if (auth.response) return auth.response;
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || '');
    const { booking, party } = await loadBookingFor(auth.user, params.id);
    if (!booking || !party) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (!ACTIONS[action]?.includes(party)) return NextResponse.json({ error: 'You cannot do that on this booking.' }, { status: 403 });
    const user = auth.user;
    const id = booking.id;

    switch (action) {
      case 'pay': {
        if (booking.status !== 'AWAITING_PAYMENT') throw new TransitionError('This booking is already paid or closed.');
        const fee = Number(booking.inspectionFeePkr);
        const gatewayFee = Math.round(fee * GATEWAY_FEE_RATE);
        const payment = await prisma.payment.upsert({
          where: { bookingId: id },
          create: { customerId: user.id, bookingId: id, amountPkr: fee, gatewayFeePkr: gatewayFee, netAmountPkr: fee - gatewayFee, gateway: 'sandbox', status: 'PENDING', idempotencyKey: crypto.randomUUID() },
          update: { status: 'PENDING', idempotencyKey: crypto.randomUUID() },
          select: { id: true, status: true },
        });
        if (payment.status === 'SUCCESS') throw new TransitionError('This booking is already paid.');
        return NextResponse.json({ checkoutUrl: `/checkout/${payment.id}` });
      }

      case 'cancel': {
        if (booking.status === 'AWAITING_PAYMENT') {
          await transition(id, ['AWAITING_PAYMENT'], 'CANCELLED');
        } else if (booking.status === 'AWAITING_SHOP_CONFIRMATION') {
          await prisma.$transaction(async (tx) => {
            await transition(id, ['AWAITING_SHOP_CONFIRMATION'], 'REFUND_PENDING', {}, tx);
            await createRefund(id, 'Cancelled by customer before the shop accepted', user.id, tx);
          });
          await notify(booking.shop.ownerId, 'A customer cancelled their booking', undefined, `/vendor/bookings/${id}`);
        } else {
          throw new TransitionError('Bookings can only be cancelled before the shop accepts them.');
        }
        return NextResponse.json({ ok: true });
      }

      case 'confirm': {
        await prisma.$transaction((tx) => completeBooking(id, tx));
        await notify(booking.shop.ownerId, 'Customer confirmed an inspection report', 'The payout for this inspection is now eligible.', `/vendor/bookings/${id}`);
        return NextResponse.json({ ok: true });
      }

      case 'dispute': {
        const { reason } = parse(DisputeSchema, body);
        if (!booking.reviewWindowExpiresAt || booking.reviewWindowExpiresAt < new Date()) throw new TransitionError('The review window for this report has closed.');
        await prisma.$transaction(async (tx) => {
          await transition(id, ['REPORT_DELIVERED'], 'DISPUTE_RAISED', { disputeReason: reason, disputeRaisedAt: new Date() }, tx);
          await tx.payoutLedger.updateMany({ where: { bookingId: id }, data: { disputeActive: true } });
        });
        const admins = await prisma.user.findMany({ where: { role: { in: ['SUPER_ADMIN', 'OPS_ADMIN'] }, status: 'ACTIVE' }, select: { id: true } });
        await notifyMany(admins.map((a) => a.id), 'A customer disputed an inspection report', reason.slice(0, 140), `/admin/bookings/${id}`);
        await notify(booking.shop.ownerId, 'A customer disputed your inspection report', 'MobCheck will review it within 48 hours. The payout is on hold.', `/vendor/bookings/${id}`);
        return NextResponse.json({ ok: true });
      }

      case 'review': {
        const data = parse(ReviewSchema, body);
        if (booking.status !== 'COMPLETED') throw new TransitionError('You can review the shop once the inspection is completed.');
        try {
          await prisma.review.create({ data: { ...data, bookingId: id, shopId: booking.shopId, customerId: user.id, status: 'PUBLISHED' } });
        } catch (e) {
          if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') throw new TransitionError('You have already reviewed this inspection.');
          throw e;
        }
        const agg = await prisma.review.aggregate({ where: { shopId: booking.shopId, status: 'PUBLISHED' }, _avg: { overallRating: true }, _count: true });
        await prisma.shop.update({ where: { id: booking.shopId }, data: { averageRating: agg._avg.overallRating ?? null, totalReviews: agg._count } });
        await notify(booking.shop.ownerId, 'You received a new review', `${data.overallRating} out of 5 stars`, '/vendor/reviews');
        return NextResponse.json({ ok: true });
      }

      case 'accept':
      case 'reject':
      case 'assign': {
        const input = parse(ShopBookingActionSchema, body);
        if (input.action === 'accept') {
          await transition(id, ['AWAITING_SHOP_CONFIRMATION', 'PAYMENT_CONFIRMED'], 'BOOKING_ACCEPTED');
          await notify(booking.customerId, `${booking.shop.name} accepted your inspection booking`, undefined, `/dashboard/bookings/${id}`);
        } else if (input.action === 'reject') {
          await prisma.$transaction(async (tx) => {
            await transition(id, ['AWAITING_SHOP_CONFIRMATION', 'PAYMENT_CONFIRMED'], 'REFUND_PENDING', { disputeResolution: `Rejected by shop: ${input.reason}` }, tx);
            await createRefund(id, `Rejected by shop: ${input.reason}`, user.id, tx);
          });
          await notify(booking.customerId, `${booking.shop.name} could not take your booking`, `${input.reason} Your payment will be refunded.`, `/dashboard/bookings/${id}`);
        } else {
          const inspector = await prisma.inspector.findUnique({ where: { id: input.inspectorId }, select: { shopId: true, status: true, userId: true } });
          if (!inspector || inspector.shopId !== booking.shopId || inspector.status !== 'ACTIVE') throw new TransitionError('Choose an active inspector from your shop.', 400);
          await transition(id, ['BOOKING_ACCEPTED', 'INSPECTOR_ASSIGNED'], 'INSPECTOR_ASSIGNED', { inspectorId: input.inspectorId });
          await notify(inspector.userId, 'You have a new inspection assigned', undefined, `/inspector/bookings/${id}`);
        }
        return NextResponse.json({ ok: true });
      }

      case 'start': {
        await transition(id, ['INSPECTOR_ASSIGNED'], 'INSPECTION_IN_PROGRESS');
        await notify(booking.customerId, 'Your phone inspection has started', undefined, `/dashboard/bookings/${id}`);
        return NextResponse.json({ ok: true });
      }

      case 'submit': {
        const { results } = parse(InspectionResultsSchema, body);
        const checklist = await prisma.inspectionChecklist.findMany({ where: { deviceType: booking.deviceType, status: 'ACTIVE' }, select: { id: true } });
        const allowed = new Set(checklist.map((c) => c.id));
        if (results.some((r) => !allowed.has(r.checklistId))) throw new TransitionError('The checklist contains items that do not belong to this device type.', 400);
        const answered = new Set(results.map((r) => r.checklistId));
        if (checklist.some((c) => !answered.has(c.id))) throw new TransitionError('Record a result for every checklist item before submitting.', 400);
        const evidence = await prisma.inspectionEvidence.count({ where: { bookingId: id } });
        if (evidence === 0) throw new TransitionError('Upload at least one photo of the device before submitting.', 400);
        await prisma.$transaction(async (tx) => {
          await transition(id, ['INSPECTION_IN_PROGRESS'], 'INSPECTION_SUBMITTED', {}, tx);
          await tx.inspectionResult.deleteMany({ where: { bookingId: id } });
          await tx.inspectionResult.createMany({ data: results.map((r) => ({ bookingId: id, checklistId: r.checklistId, result: r.result, inspectorNotes: r.inspectorNotes || null, testedAt: new Date() })) });
        });
        return NextResponse.json({ ok: true });
      }

      case 'generate_report': {
        const report = await generateReport(id);
        return NextResponse.json({ data: { reportNumber: report.reportNumber } });
      }

      case 'release':
      case 'refund':
      case 'mark_refunded': {
        const { note } = parse(AdminBookingActionSchema, body);
        if (action === 'release') {
          await prisma.$transaction(async (tx) => {
            await completeBooking(id, tx, ['DISPUTE_RAISED']);
            await tx.inspectionBooking.update({ where: { id }, data: { disputeResolvedAt: new Date(), disputeResolution: note || 'Dispute reviewed: report upheld, payout released.' } });
            await tx.payoutLedger.updateMany({ where: { bookingId: id }, data: { disputeResolved: true, disputeResolvedAt: new Date() } });
            await tx.adminAction.create({ data: { adminId: user.id, actionType: 'DISPUTE_RESOLVE', entityType: 'booking', entityId: id, description: `Dispute resolved in favour of shop. ${note || ''}`.trim() } });
          });
          await notify(booking.customerId, 'Your dispute has been reviewed', note || 'MobCheck upheld the inspection report.', `/dashboard/bookings/${id}`);
          await notify(booking.shop.ownerId, 'Dispute resolved in your favour', 'The payout for this inspection is released.', `/vendor/bookings/${id}`);
        } else if (action === 'refund') {
          await prisma.$transaction(async (tx) => {
            await transition(id, ['DISPUTE_RAISED'], 'REFUND_PENDING', { disputeResolvedAt: new Date(), disputeResolution: note || 'Dispute upheld: customer refunded.' }, tx);
            await createRefund(id, note || 'Dispute upheld by MobCheck', user.id, tx);
            await tx.payoutLedger.updateMany({ where: { bookingId: id }, data: { disputeResolved: true, disputeResolvedAt: new Date() } });
            await tx.adminAction.create({ data: { adminId: user.id, actionType: 'PAYMENT_REFUND', entityType: 'booking', entityId: id, description: `Dispute upheld, refund issued. ${note || ''}`.trim() } });
          });
          await notify(booking.customerId, 'Your dispute was upheld', 'A full refund is on its way.', `/dashboard/bookings/${id}`);
          await notify(booking.shop.ownerId, 'A dispute was upheld against your shop', note, `/vendor/bookings/${id}`);
        } else {
          await prisma.$transaction(async (tx) => {
            await transition(id, ['REFUND_PENDING'], 'REFUNDED', {}, tx);
            await tx.refund.updateMany({ where: { bookingId: id, status: { in: ['PENDING', 'APPROVED', 'PROCESSING'] } }, data: { status: 'SUCCESS', approvedById: user.id, approvedAt: new Date() } });
            await tx.payment.updateMany({ where: { bookingId: id }, data: { status: 'REFUNDED' } });
            await tx.adminAction.create({ data: { adminId: user.id, actionType: 'PAYMENT_REFUND', entityType: 'booking', entityId: id, description: `Refund marked as paid. ${note || ''}`.trim() } });
          });
          await notify(booking.customerId, 'Your refund has been paid', undefined, `/dashboard/bookings/${id}`);
        }
        return NextResponse.json({ ok: true });
      }
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    if (error instanceof TransitionError) {
      return NextResponse.json({ error: error.message, fields: (error as any).fields }, { status: error.status });
    }
    return serverError('Booking action error', error);
  }
}
