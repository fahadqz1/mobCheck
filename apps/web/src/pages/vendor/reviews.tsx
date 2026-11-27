import type { GetServerSideProps } from 'next';
import { Star } from 'lucide-react';
import prisma from '@/lib/prisma';
import { requirePageAuth } from '@/lib/ssr-auth';
import { DashboardLayout } from '@/components/layout/Layouts';
import { Card, StatCard } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { Stars } from '@/components/ui/Rating';
import { NeedsShop } from '@/components/vendor/NeedsShop';
import { formatDate } from '@/lib/format';

export const getServerSideProps: GetServerSideProps = (ctx) =>
  requirePageAuth(ctx, ['SHOP_OWNER'], async (user) => {
    const shop = await prisma.shop.findFirst({ where: { ownerId: user.id }, select: { id: true } });
    if (!shop) return { hasShop: false, reviews: [], stats: null };
    const [reviews, stats] = await Promise.all([
      prisma.review.findMany({
        where: { shopId: shop.id, status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { customer: { select: { firstName: true, lastName: true } }, booking: { select: { brand: { select: { name: true } }, model: { select: { name: true } } } } },
      }),
      prisma.review.aggregate({ where: { shopId: shop.id, status: 'PUBLISHED' }, _avg: { overallRating: true, professionalism: true, timeliness: true }, _count: true }),
    ]);
    const recommend = reviews.filter((r) => r.wouldRecommend).length;
    return { hasShop: true, reviews, stats: { average: stats._avg.overallRating, count: stats._count, recommendPct: reviews.length ? Math.round((recommend / reviews.length) * 100) : null } };
  });

export default function VendorReviews({ hasShop, reviews, stats }: any) {
  return (
    <DashboardLayout title="Reviews" description="What customers said after completed inspections.">
      {!hasShop ? (
        <NeedsShop />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-3 gap-4">
            <StatCard label="Average rating" value={stats.average ? `${stats.average.toFixed(1)} / 5` : '—'} icon={Star} />
            <StatCard label="Reviews" value={stats.count} />
            <StatCard label="Would recommend" value={stats.recommendPct === null ? '—' : `${stats.recommendPct}%`} />
          </div>
          {reviews.length === 0 ? (
            <EmptyState icon={Star} title="No reviews yet" description="Customers can review your shop after they confirm their inspection report." />
          ) : (
            <Card>
              <ul className="divide-y divide-slate-100">
                {reviews.map((r: any) => (
                  <li key={r.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2"><Stars value={r.overallRating} /><span className="text-sm font-medium">{r.customer.firstName} {r.customer.lastName?.[0]}.</span></div>
                      <span className="text-xs text-slate-500">{formatDate(r.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{r.booking.brand.name} {r.booking.model.name}{r.wouldRecommend ? ' · Recommends your shop' : ''}</p>
                    {r.reviewText && <p className="mt-2 text-sm text-slate-700">{r.reviewText}</p>}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
