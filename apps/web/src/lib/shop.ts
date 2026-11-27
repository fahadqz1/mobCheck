import type { Prisma } from '@prisma/client';
import prisma from './prisma';
import { fileUrl } from './format';

// Ratings come from published Review rows; the denormalised Shop.averageRating/totalReviews columns can drift.
export async function liveRatings(shopIds: string[]) {
  const rows = shopIds.length
    ? await prisma.review.groupBy({ by: ['shopId'], where: { shopId: { in: shopIds }, status: 'PUBLISHED' }, _avg: { overallRating: true }, _count: true })
    : [];
  const map = new Map(rows.map((r) => [r.shopId, { averageRating: r._avg.overallRating, totalReviews: r._count }]));
  return (id: string) => map.get(id) ?? { averageRating: null, totalReviews: 0 };
}
import type { ShopCardData } from '@/components/shops/ShopCard';

export const shopCardSelect = {
  id: true,
  slug: true,
  name: true,
  city: true,
  area: true,
  logoUrl: true,
  coverUrl: true,
  averageRating: true,
  totalReviews: true,
  openingHour: true,
  closingHour: true,
  completedInspections: true,
  _count: { select: { services: { where: { status: 'ACTIVE' } } } },
} satisfies Prisma.ShopSelect;

export async function toShopCards(shops: Prisma.ShopGetPayload<{ select: typeof shopCardSelect }>[]) {
  const rating = await liveRatings(shops.map((s) => s.id));
  return shops.map((s) => ({ ...toShopCard(s), ...rating(s.id) }));
}

function toShopCard(s: Prisma.ShopGetPayload<{ select: typeof shopCardSelect }>): ShopCardData {
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    city: s.city,
    area: s.area,
    logoUrl: fileUrl(s.logoUrl),
    coverUrl: fileUrl(s.coverUrl),
    averageRating: s.averageRating ? Number(s.averageRating) : null,
    totalReviews: s.totalReviews,
    openingHour: s.openingHour,
    closingHour: s.closingHour,
    servicesCount: s._count.services,
    completedInspections: s.completedInspections,
  };
}

export function buildShopWhere(params: URLSearchParams): Prisma.ShopWhereInput {
  const where: Prisma.ShopWhereInput = { status: 'VERIFIED' };
  const city = params.get('city');
  if (city) where.city = city;
  const q = params.get('q')?.trim();
  if (q) where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { area: { contains: q, mode: 'insensitive' } }];
  return where;
}

export const shopOrder = (sort: string | null): Prisma.ShopOrderByWithRelationInput[] =>
  sort === 'reviews' ? [{ reviews: { _count: 'desc' } }, { name: 'asc' }] : [{ name: 'asc' }];
