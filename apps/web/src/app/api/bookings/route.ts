import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { BookingSchema } from '@/lib/validation';
import { parseBody, serverError } from '@/lib/api';
import { getInspectionFee } from '@/lib/settings';
import { validateSlot } from '@/lib/schedule';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request, ['CUSTOMER', 'SELLER']);
    if (auth.response) return auth.response;
    const parsed = await parseBody(request, BookingSchema);
    if (parsed.response) return parsed.response;
    const { shopId, brandId, modelId, deviceStorageGb, deviceColor, ptaStatus, date, time } = parsed.data;

    const [shop, model] = await Promise.all([
      prisma.shop.findUnique({
        where: { id: shopId },
        select: { id: true, status: true, openingHour: true, closingHour: true, weeklyHolidays: true, inspectors: { select: { status: true, availableMonday: true, availableTuesday: true, availableWednesday: true, availableThursday: true, availableFriday: true, availableSaturday: true, availableSunday: true } } },
      }),
      prisma.model.findUnique({ where: { id: modelId }, select: { brandId: true, os: true } }),
    ]);
    if (!shop || shop.status !== 'VERIFIED') return NextResponse.json({ error: 'This shop is not accepting bookings.' }, { status: 400 });
    if (!model || model.brandId !== brandId) return NextResponse.json({ error: 'Please correct the highlighted fields.', fields: { modelId: 'Choose a model from the selected brand' } }, { status: 400 });

    const slot = validateSlot(date, time, shop, shop.inspectors);
    if (!slot.when) return NextResponse.json({ error: slot.error, fields: { [slot.field || 'date']: slot.error } }, { status: 400 });

    const booking = await prisma.inspectionBooking.create({
      data: {
        customerId: auth.user.id,
        shopId,
        brandId,
        modelId,
        deviceStorageGb,
        deviceColor,
        ptaStatus,
        deviceType: model.os === 'IOS' ? 'IPHONE' : 'ANDROID',
        inspectionDate: slot.when,
        status: 'AWAITING_PAYMENT',
        inspectionFeePkr: await getInspectionFee(),
      },
      select: { id: true },
    });
    return NextResponse.json({ data: booking }, { status: 201 });
  } catch (error) {
    return serverError('Create booking error', error, 'Could not create the booking.');
  }
}
