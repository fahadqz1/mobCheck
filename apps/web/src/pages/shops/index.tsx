import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { Search, Store } from 'lucide-react';
import prisma from '@/lib/prisma';
import { getSsrUser } from '@/lib/ssr-auth';
import { serialize } from '@/lib/serialize';
import { buildShopWhere, shopCardSelect, shopOrder, toShopCards } from '@/lib/shop';
import { SiteLayout } from '@/components/layout/Layouts';
import { ShopCard, type ShopCardData } from '@/components/shops/ShopCard';
import { EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Form';
import { Pagination } from '@/components/ui/Pagination';
import { useRouteLoading } from '@/hooks/useRouteLoading';
import { CITIES, formatPKR } from '@/lib/format';
import { getInspectionFee } from '@/lib/settings';

const PAGE_SIZE = 12;
type Props = { shops: ShopCardData[]; total: number; page: number; pages: number; fee: number; user: any };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const params = new URLSearchParams();
  for (const k of ['city', 'q', 'sort']) {
    const v = ctx.query[k];
    if (typeof v === 'string' && v) params.set(k, v);
  }
  const page = Math.max(1, parseInt(String(ctx.query.page || '1')) || 1);
  const where = buildShopWhere(params);
  const [shops, total, fee, user] = await Promise.all([
    prisma.shop.findMany({ where, select: shopCardSelect, orderBy: shopOrder(params.get('sort')), skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.shop.count({ where }),
    getInspectionFee(),
    getSsrUser(ctx),
  ]);
  return { props: serialize({ shops: await toShopCards(shops), total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)), fee, user }) };
};

export default function Shops({ shops, total, page, pages, fee }: Props) {
  const router = useRouter();
  const loading = useRouteLoading();
  const query = router.query as Record<string, string | undefined>;
  const [q, setQ] = useState(query.q || '');
  useEffect(() => setQ(query.q || ''), [query.q]);

  const apply = (changes: Record<string, string | undefined>) => {
    const next: Record<string, string> = {};
    for (const k of ['city', 'q', 'sort']) {
      const v = k in changes ? changes[k] : query[k];
      if (v) next[k] = v;
    }
    router.push({ pathname: '/shops', query: next }, undefined, { scroll: false });
  };

  return (
    <SiteLayout title="Inspection shops">
      <div className="border-b border-slate-200 bg-white">
        <div className="page-container py-8">
          <h1 className="text-2xl font-semibold sm:text-3xl">Verified inspection shops</h1>
          <p className="mt-1 max-w-2xl text-slate-600">
            Each shop below passed MobCheck&apos;s document checks. A full device inspection costs {formatPKR(fee)} at any of them.
          </p>
          <form
            role="search"
            className="mt-5 grid gap-2 sm:grid-cols-[1fr_200px_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              apply({ q: q.trim() || undefined });
            }}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <Input aria-label="Search shops" placeholder="Shop name or market" value={q} onChange={(e) => setQ(e.target.value)} className="h-11 pl-9" />
            </div>
            <Select aria-label="City" value={query.city || ''} onChange={(e) => apply({ city: e.target.value || undefined })} className="h-11">
              <option value="">All cities</option>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
            <Button type="submit" size="lg" className="h-11">Search</Button>
          </form>
        </div>
      </div>

      <div className="page-container py-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-600" aria-live="polite"><span className="font-semibold text-ink">{total}</span> {total === 1 ? 'shop' : 'shops'}</p>
          <div className="w-48">
            <Select aria-label="Sort shops" value={query.sort || ''} onChange={(e) => apply({ sort: e.target.value || undefined })} className="h-9">
              <option value="">Name A–Z</option>
              <option value="reviews">Most reviewed</option>
            </Select>
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-64 animate-pulse rounded-xl bg-slate-200/70" />)}
          </div>
        ) : shops.length === 0 ? (
          <EmptyState icon={Store} title="No verified shops here yet" description="Try another city, or check back soon. New shops are added every week." action={query.city || query.q ? <Button variant="outline" onClick={() => router.push('/shops')}>Show all shops</Button> : undefined} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{shops.map((s) => <ShopCard key={s.id} shop={s} />)}</div>
        )}
        <Pagination page={page} pages={pages} />
      </div>
    </SiteLayout>
  );
}
