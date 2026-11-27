import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { serverError } from '@/lib/api';
import { buildShopWhere, shopCardSelect, shopOrder, toShopCards } from '@/lib/shop';

const PAGE_SIZE = 12;

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get('page') || '1') || 1);
    const where = buildShopWhere(params);
    const [shops, total] = await Promise.all([
      prisma.shop.findMany({ where, select: shopCardSelect, orderBy: shopOrder(params.get('sort')), skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
      prisma.shop.count({ where }),
    ]);
    return NextResponse.json({ data: await toShopCards(shops), pagination: { page, pageSize: PAGE_SIZE, total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) } });
  } catch (error) {
    return serverError('Get shops error', error, 'Could not load shops.');
  }
}
