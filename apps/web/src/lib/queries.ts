import type { Prisma } from '@prisma/client';

export const bookingListInclude = {
  brand: { select: { name: true } },
  model: { select: { name: true } },
  shop: { select: { name: true, slug: true, city: true, area: true } },
  customer: { select: { firstName: true, lastName: true } },
  inspector: { select: { user: { select: { firstName: true, lastName: true } } } },
  inspectionReport: { select: { reportNumber: true, overallAssessment: true } },
} satisfies Prisma.InspectionBookingInclude;

export const listingCardInclude = {
  brand: { select: { name: true } },
  model: { select: { name: true } },
  photos: { orderBy: [{ isPrimary: 'desc' }, { uploadSequence: 'asc' }], take: 1, select: { id: true, storageKey: true } },
} satisfies Prisma.PhoneListingInclude;
