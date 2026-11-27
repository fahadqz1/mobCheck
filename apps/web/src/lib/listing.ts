import type { Prisma } from '@prisma/client';
import { fileUrl } from './format';

export type ListingCard = {
  id: string;
  title: string;
  brand: string;
  model: string;
  storageGb: number | null;
  pricePkr: number;
  condition: string;
  ptaStatus: string;
  locationCity: string;
  locationArea: string;
  listedAt: string;
  photoUrl: string | null;
};

export function toListingCard(l: any): ListingCard {
  return {
    id: l.id,
    title: l.title,
    brand: l.brand.name,
    model: l.model.name,
    storageGb: l.storageGb,
    pricePkr: Number(l.pricePkr),
    condition: l.condition,
    ptaStatus: l.ptaStatus,
    locationCity: l.locationCity,
    locationArea: l.locationArea,
    listedAt: new Date(l.listedAt).toISOString(),
    photoUrl: fileUrl(l.photos?.[0]?.storageKey),
  };
}

const CONDITIONS = ['BRAND_NEW', 'LIKE_NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'FOR_PARTS'];
const PTA = ['APPROVED', 'NON_PTA'];

export function buildListingWhere(params: URLSearchParams): Prisma.PhoneListingWhereInput {
  const where: Prisma.PhoneListingWhereInput = { status: 'ACTIVE' };
  const q = params.get('q')?.trim();
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { brand: { name: { contains: q, mode: 'insensitive' } } },
      { model: { name: { contains: q, mode: 'insensitive' } } },
    ];
  }
  const city = params.get('city');
  if (city) where.locationCity = city;
  const brand = params.get('brand');
  if (brand) where.brand = { slug: brand };
  const condition = params.get('condition');
  if (condition && CONDITIONS.includes(condition)) where.condition = condition as Prisma.EnumPhoneConditionFilter['equals'];
  const pta = params.get('pta');
  if (pta && PTA.includes(pta)) where.ptaStatus = pta as Prisma.EnumDeviceStatusFilter['equals'];
  const min = Number(params.get('minPrice'));
  const max = Number(params.get('maxPrice'));
  if (min > 0 || max > 0) where.pricePkr = { ...(min > 0 ? { gte: min } : {}), ...(max > 0 ? { lte: max } : {}) };
  return where;
}

export function listingOrder(sort: string | null): Prisma.PhoneListingOrderByWithRelationInput {
  if (sort === 'price_asc') return { pricePkr: 'asc' };
  if (sort === 'price_desc') return { pricePkr: 'desc' };
  return { listedAt: 'desc' };
}

export const LISTING_PAGE_SIZE = 12;
