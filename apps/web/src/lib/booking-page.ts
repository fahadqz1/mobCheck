import type { GetServerSidePropsContext } from 'next';
import prisma from './prisma';
import { requirePageAuth } from './ssr-auth';
import { loadBookingFor, settleExpiredReviewWindows, type Party } from './bookings';
import { fileUrl } from './format';

export type BookingView = Awaited<ReturnType<typeof buildView>>;

async function buildView(id: string, party: Exclude<Party, null>) {
  const b = await prisma.inspectionBooking.findUniqueOrThrow({
    where: { id },
    include: {
      brand: { select: { name: true } },
      model: { select: { name: true } },
      shop: { select: { id: true, name: true, slug: true, addressLine1: true, area: true, city: true, phone: true, whatsapp: true } },
      customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
      inspector: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
      payment: { select: { status: true, amountPkr: true, gatewayTransactionId: true, processedAt: true } },
      inspectionReport: { select: { reportNumber: true, overallAssessment: true, assessmentSummary: true, createdAt: true } },
      inspectionResults: { include: { checklist: { select: { category: true, categorySequence: true, checkName: true, checkSequence: true } } } },
      inspectionEvidence: { orderBy: { photoSequence: 'asc' } },
      review: { select: { overallRating: true, reviewText: true, createdAt: true } },
      refunds: { select: { status: true, amountPkr: true, reason: true, createdAt: true } },
      payoutLedger: party === 'admin' || party === 'shop' ? { select: { shopPayoutPkr: true, mobcheckMarginPkr: true, gatewayFeePkr: true, payoutStatus: true, payoutEligible: true, disputeActive: true } } : false,
    },
  });
  const showCustomerContact = party !== 'customer' && !['AWAITING_PAYMENT', 'CANCELLED'].includes(b.status);
  const reportVisible = !!b.inspectionReport;

  const checklist =
    party === 'inspector' && ['INSPECTION_IN_PROGRESS', 'INSPECTOR_ASSIGNED'].includes(b.status)
      ? await prisma.inspectionChecklist.findMany({ where: { deviceType: b.deviceType, status: 'ACTIVE' }, orderBy: [{ categorySequence: 'asc' }, { checkSequence: 'asc' }], select: { id: true, category: true, checkName: true, description: true, testInstructions: true } })
      : [];
  const inspectors =
    party === 'shop'
      ? (await prisma.inspector.findMany({ where: { shopId: b.shopId, status: 'ACTIVE' }, include: { user: { select: { firstName: true, lastName: true } } } })).map((i) => ({ id: i.id, name: [i.user.firstName, i.user.lastName].filter(Boolean).join(' ') }))
      : [];

  return {
    id: b.id,
    status: b.status,
    party,
    createdAt: b.createdAt.toISOString(),
    inspectionDate: b.inspectionDate.toISOString(),
    deviceType: b.deviceType,
    device: { brand: b.brand.name, model: b.model.name, storageGb: b.deviceStorageGb, color: b.deviceColor, pta: b.ptaStatus },
    fee: Number(b.inspectionFeePkr),
    shop: b.shop,
    customer: showCustomerContact || party === 'admin' ? b.customer : { firstName: b.customer.firstName, lastName: b.customer.lastName, email: null, phone: null },
    inspectorName: b.inspector ? [b.inspector.user.firstName, b.inspector.user.lastName].filter(Boolean).join(' ') : null,
    inspectorId: b.inspector?.id ?? null,
    payment: b.payment && { status: b.payment.status, amount: Number(b.payment.amountPkr), transactionId: b.payment.gatewayTransactionId, paidAt: b.payment.processedAt?.toISOString() ?? null },
    report: reportVisible ? { ...b.inspectionReport!, createdAt: b.inspectionReport!.createdAt.toISOString() } : null,
    results: reportVisible || party !== 'customer'
      ? b.inspectionResults
          .sort((x, y) => x.checklist.categorySequence - y.checklist.categorySequence || x.checklist.checkSequence - y.checklist.checkSequence)
          .map((r) => ({ id: r.id, checklistId: r.checklistId, category: r.checklist.category, checkName: r.checklist.checkName, result: r.result, notes: r.inspectorNotes }))
      : [],
    evidence: reportVisible || party !== 'customer' ? b.inspectionEvidence.map((e) => ({ id: e.id, url: fileUrl(e.storageKey)!, annotationType: e.annotationType, annotationText: e.annotationText })) : [],
    review: b.review && { ...b.review, createdAt: b.review.createdAt.toISOString() },
    refunds: b.refunds.map((r) => ({ ...r, amountPkr: Number(r.amountPkr), createdAt: r.createdAt.toISOString() })),
    payout: (b as any).payoutLedger
      ? { shopPayout: Number((b as any).payoutLedger.shopPayoutPkr), margin: Number((b as any).payoutLedger.mobcheckMarginPkr), gatewayFee: Number((b as any).payoutLedger.gatewayFeePkr), status: (b as any).payoutLedger.payoutStatus, eligible: (b as any).payoutLedger.payoutEligible, onHold: (b as any).payoutLedger.disputeActive }
      : null,
    reportDeliveredAt: b.reportDeliveredAt?.toISOString() ?? null,
    reviewWindowExpiresAt: b.reviewWindowExpiresAt?.toISOString() ?? null,
    dispute: b.disputeReason ? { reason: b.disputeReason, raisedAt: b.disputeRaisedAt?.toISOString() ?? null, resolution: b.disputeResolution } : b.disputeResolution ? { reason: null, raisedAt: null, resolution: b.disputeResolution } : null,
    checklist,
    inspectors,
  };
}

const ROLES_FOR: Record<Exclude<Party, null>, any[]> = {
  customer: ['CUSTOMER', 'SELLER'],
  shop: ['SHOP_OWNER'],
  inspector: ['INSPECTOR'],
  admin: ['SUPER_ADMIN', 'OPS_ADMIN'],
};

export function bookingPageProps(ctx: GetServerSidePropsContext, expected: Exclude<Party, null>) {
  return requirePageAuth(ctx, ROLES_FOR[expected], async (user) => {
    await settleExpiredReviewWindows();
    const { booking, party } = await loadBookingFor(user, String(ctx.params?.id));
    if (!booking || party !== expected) return { notFound: true as const };
    return { booking: await buildView(booking.id, expected) };
  });
}
