import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ListingSchema } from '@/lib/validation';
import { requireUser } from '@/lib/session';
import { parseBody, serverError } from '@/lib/api';
import { listingCardInclude } from '@/lib/queries';
import { buildListingWhere, LISTING_PAGE_SIZE, listingOrder, toListingCard } from '@/lib/listing';

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get('page') || '1') || 1);
    const where = buildListingWhere(params);
    const [listings, total] = await Promise.all([
      prisma.phoneListing.findMany({
        where,
        include: listingCardInclude,
        orderBy: listingOrder(params.get('sort')),
        skip: (page - 1) * LISTING_PAGE_SIZE,
        take: LISTING_PAGE_SIZE,
      }),
      prisma.phoneListing.count({ where }),
    ]);
    return NextResponse.json({
      data: listings.map(toListingCard),
      pagination: { page, pageSize: LISTING_PAGE_SIZE, total, pages: Math.max(1, Math.ceil(total / LISTING_PAGE_SIZE)) },
    });
  } catch (error) {
    return serverError('Get listings error', error, 'Could not load listings.');
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request, ['CUSTOMER', 'SELLER', 'SHOP_OWNER']);
    if (auth.response) return auth.response;
    const parsed = await parseBody(request, ListingSchema);
    if (parsed.response) return parsed.response;
    const data = parsed.data;

    const model = await prisma.model.findUnique({ where: { id: data.modelId }, select: { brandId: true } });
    if (!model || model.brandId !== data.brandId) {
      return NextResponse.json({ error: 'Please correct the highlighted fields.', fields: { modelId: 'This model does not belong to the selected brand' } }, { status: 400 });
    }
    const shop = auth.user.role === 'SHOP_OWNER' ? await prisma.shop.findFirst({ where: { ownerId: auth.user.id }, select: { id: true } }) : null;

    const listing = await prisma.phoneListing.create({
      data: { ...data, userId: auth.user.id, shopId: shop?.id, status: 'ACTIVE', listedAt: new Date() },
      select: { id: true },
    });
    return NextResponse.json({ data: listing }, { status: 201 });
  } catch (error) {
    return serverError('Create listing error', error, 'Could not create the listing.');
  }
}
