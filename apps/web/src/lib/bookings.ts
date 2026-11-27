import crypto from 'crypto';
import type { BookingStatus, Prisma } from '@prisma/client';
import prisma from './prisma';
import { notify } from './notify';
import { getCommissionPercent, getReviewWindowHours } from './settings';
import type { SessionUser } from './session';

export type Party = 'customer' | 'shop' | 'inspector' | 'admin' | null;

const bookingAccessInclude = {
  shop: { select: { id: true, name: true, ownerId: true, slug: true } },
  inspector: { select: { id: true, userId: true } },
} satisfies Prisma.InspectionBookingInclude;

export async function loadBookingFor(user: SessionUser, bookingId: string) {
  const booking = await prisma.inspectionBooking.findUnique({ where: { id: bookingId }, include: bookingAccessInclude });
  if (!booking) return { booking: null, party: null as Party };
  let party: Party = null;
  if (user.role === 'SUPER_ADMIN' || user.role === 'OPS_ADMIN') party = 'admin';
  else if (booking.customerId === user.id) party = 'customer';
  else if (booking.shop.ownerId === user.id) party = 'shop';
  else if (booking.inspector?.userId === user.id) party = 'inspector';
  return { booking, party };
}

export class TransitionError extends Error {
  status: number;
  constructor(message: string, status = 409) {
    super(message);
    this.status = status;
  }
}

// Optimistic status guard: the update only applies if the booking is still in an allowed state.
export async function transition(
  id: string,
  from: BookingStatus[],
  to: BookingStatus,
  data: Prisma.InspectionBookingUncheckedUpdateManyInput = {},
  tx: Prisma.TransactionClient = prisma
) {
  const { count } = await tx.inspectionBooking.updateMany({ where: { id, status: { in: from } }, data: { ...data, status: to } });
  if (count === 0) throw new TransitionError('This booking has changed since you opened it. Refresh the page and try again.');
}

export async function createRefund(bookingId: string, reason: string, requestedById: string, tx: Prisma.TransactionClient) {
  const payment = await tx.payment.findUnique({ where: { bookingId } });
  if (!payment || payment.status !== 'SUCCESS') return false;
  await tx.refund.create({ data: { paymentId: payment.id, bookingId, amountPkr: payment.amountPkr, reason, requestedById, status: 'PENDING' } });
  await tx.payoutLedger.updateMany({ where: { bookingId }, data: { payoutEligible: false, disputeActive: false } });
  return true;
}

export async function generateReport(bookingId: string) {
  const booking = await prisma.inspectionBooking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { inspectionResults: true, shop: { select: { ownerId: true, name: true } } },
  });
  if (booking.status !== 'INSPECTION_SUBMITTED') throw new TransitionError('Submit the inspection before generating the report.');
  const results = booking.inspectionResults;
  const fails = results.filter((r) => r.result === 'FAIL').length;
  const attention = results.filter((r) => r.result === 'NEEDS_ATTENTION').length;
  const passes = results.filter((r) => r.result === 'PASS').length;
  const level = fails > 0 ? 'CRITICAL_ISSUES' : attention > 2 ? 'NEEDS_ATTENTION' : attention > 0 ? 'FAIR' : passes === results.length ? 'EXCELLENT' : 'GOOD';
  const summary = {
    EXCELLENT: 'All checked items passed. No faults were found during the inspection.',
    GOOD: 'No faults were found. Some items could not be tested or were not applicable.',
    FAIR: 'The device works, with minor issues noted below.',
    NEEDS_ATTENTION: 'Several items need attention. Review the findings before buying.',
    CRITICAL_ISSUES: 'One or more checks failed. Review the failed items carefully before buying.',
  }[level];
  const hours = await getReviewWindowHours();

  return prisma.$transaction(async (tx) => {
    let reportNumber = '';
    for (let i = 0; i < 5 && !reportNumber; i++) {
      const candidate = `MC-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      if (!(await tx.inspectionReport.findUnique({ where: { reportNumber: candidate } }))) reportNumber = candidate;
    }
    const report = await tx.inspectionReport.create({
      data: {
        bookingId,
        reportNumber,
        qrCodeId: crypto.randomUUID(),
        overallAssessment: level as any,
        assessmentSummary: summary,
        pdfStorageKey: '',
        isVerified: true,
        version: 1,
      },
    });
    const now = new Date();
    const expires = new Date(now.getTime() + hours * 3600000);
    await transition(bookingId, ['INSPECTION_SUBMITTED'], 'REPORT_DELIVERED', { reportDeliveredAt: now, reviewWindowExpiresAt: expires }, tx);
    await tx.payoutLedger.updateMany({ where: { bookingId }, data: { reportDelivered: true, reportDeliveredAt: now, reviewWindowExpiresAt: expires } });
    await tx.notification.create({
      data: { userId: booking.customerId, title: 'Your inspection report is ready', body: `${booking.shop.name} finished inspecting your phone. You have ${hours} hours to confirm or raise a dispute.`, link: `/dashboard/bookings/${bookingId}` },
    });
    return report;
  });
}

export async function completeBooking(bookingId: string, tx: Prisma.TransactionClient, from: BookingStatus[] = ['REPORT_DELIVERED']) {
  const booking = await tx.inspectionBooking.findUniqueOrThrow({ where: { id: bookingId }, select: { shopId: true, inspectorId: true } });
  await transition(bookingId, from, 'COMPLETED', { customerConfirmedAt: new Date() }, tx);
  await tx.payoutLedger.updateMany({ where: { bookingId }, data: { customerConfirmed: true, customerConfirmedAt: new Date(), payoutEligible: true, payoutEligibleAt: new Date(), disputeActive: false } });
  await tx.shop.update({ where: { id: booking.shopId }, data: { completedInspections: { increment: 1 }, totalInspections: { increment: 1 } } });
  if (booking.inspectorId) await tx.inspector.update({ where: { id: booking.inspectorId }, data: { completedInspections: { increment: 1 }, totalInspections: { increment: 1 } } });
}

// No scheduler runs yet, so expired review windows are settled lazily whenever bookings are read.
export async function settleExpiredReviewWindows() {
  const expired = await prisma.inspectionBooking.findMany({ where: { status: 'REPORT_DELIVERED', reviewWindowExpiresAt: { lt: new Date() } }, select: { id: true } });
  for (const { id } of expired) {
    await prisma.$transaction((tx) => completeBooking(id, tx)).catch(() => {});
  }
}

export async function processPaymentSuccess(paymentId: string, transactionId: string) {
  const commission = await getCommissionPercent();
  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new TransitionError('Payment not found', 404);
    if (payment.status === 'SUCCESS') return { alreadyProcessed: true, payment };
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'SUCCESS', gatewayTransactionId: transactionId, webhookReceivedAt: new Date(), webhookVerified: true, webhookSignatureVerified: true, processedAt: new Date() },
    });
    await transition(payment.bookingId, ['AWAITING_PAYMENT'], 'AWAITING_SHOP_CONFIRMATION', { paymentId: payment.id }, tx);
    const gross = Number(payment.amountPkr);
    const gatewayFee = Number(payment.gatewayFeePkr);
    const margin = Math.round((gross * commission) / 100);
    await tx.payoutLedger.create({
      data: {
        shopId: (await tx.inspectionBooking.findUniqueOrThrow({ where: { id: payment.bookingId }, select: { shopId: true } })).shopId,
        bookingId: payment.bookingId,
        grossInspectionFeePkr: gross,
        gatewayFeePkr: gatewayFee,
        mobcheckMarginPkr: margin,
        shopPayoutPkr: gross - gatewayFee - margin,
        paymentConfirmed: true,
        paymentConfirmedAt: new Date(),
      },
    });
    return { alreadyProcessed: false, payment };
  });
  if (!result.alreadyProcessed) {
    const booking = await prisma.inspectionBooking.findUnique({ where: { id: result.payment.bookingId }, include: { shop: { select: { ownerId: true } }, brand: true, model: true } });
    if (booking) {
      await notify(booking.shop.ownerId, 'New paid inspection booking', `${booking.brand.name} ${booking.model.name} on ${booking.inspectionDate.toLocaleString('en-PK')}. Accept it to confirm.`, `/vendor/bookings/${booking.id}`);
    }
  }
  return result;
}

export async function processPaymentFailure(paymentId: string) {
  await prisma.payment.updateMany({ where: { id: paymentId, status: { in: ['PENDING', 'PROCESSING'] } }, data: { status: 'FAILED', processedAt: new Date() } });
}
