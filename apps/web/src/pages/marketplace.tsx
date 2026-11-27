import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { Search, SearchX, SlidersHorizontal, X } from 'lucide-react';
import prisma from '@/lib/prisma';
import { getSsrUser } from '@/lib/ssr-auth';
import { serialize } from '@/lib/serialize';
import { buildListingWhere, LISTING_PAGE_SIZE, listingOrder, toListingCard, type ListingCard as ListingCardData } from '@/lib/listing';
import { listingCardInclude } from '@/lib/queries';
import { SiteLayout } from '@/components/layout/Layouts';
import { ListingCard, ListingCardSkeleton } from '@/components/listings/ListingCard';
import { EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Form';
import { Pagination } from '@/components/ui/Pagination';
import { useRouteLoading } from '@/hooks/useRouteLoading';
import { CITIES, CONDITION_LABEL } from '@/lib/format';
import { cn } from '@/lib/cn';

type Props = {
  listings: ListingCardData[];
  total: number;
  page: number;
  pages: number;
  brands: { slug: string; name: string }[];
  user: any;
};

const FILTER_KEYS = ['q', 'city', 'brand', 'condition', 'pta', 'minPrice', 'maxPrice', 'sort'] as const;

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const v = ctx.query[key];
    if (typeof v === 'string' && v) params.set(key, v);
  }
  const page = Math.max(1, parseInt(String(ctx.query.page || '1')) || 1);
  const where = buildListingWhere(params);
  const [listings, total, brands, user] = await Promise.all([
    prisma.phoneListing.findMany({ where, include: listingCardInclude, orderBy: listingOrder(params.get('sort')), skip: (page - 1) * LISTING_PAGE_SIZE, take: LISTING_PAGE_SIZE }),
    prisma.phoneListing.count({ where }),
    prisma.brand.findMany({ select: { slug: true, name: true }, orderBy: { name: 'asc' } }),
    getSsrUser(ctx),
  ]);
  return { props: serialize({ listings: listings.map(toListingCard), total, page, pages: Math.max(1, Math.ceil(total / LISTING_PAGE_SIZE)), brands, user }) };
};

export default function Marketplace({ listings, total, page, pages, brands }: Props) {
  const router = useRouter();
  const loading = useRouteLoading();
  const query = router.query as Record<string, string | undefined>;
  const [q, setQ] = useState(query.q || '');
  const [minPrice, setMinPrice] = useState(query.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(query.maxPrice || '');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setQ(query.q || '');
    setMinPrice(query.minPrice || '');
    setMaxPrice(query.maxPrice || '');
  }, [query.q, query.minPrice, query.maxPrice]);

  const apply = (changes: Record<string, string | undefined>) => {
    const next: Record<string, string> = {};
    for (const key of FILTER_KEYS) {
      const v = key in changes ? changes[key] : query[key];
      if (v) next[key] = v;
    }
    router.push({ pathname: '/marketplace', query: next }, undefined, { scroll: false });
  };

  const active = FILTER_KEYS.filter((k) => k !== 'sort' && query[k]);

  const filters = (
    <div className="space-y-4">
      <FilterSelect label="City" value={query.city} onChange={(v) => apply({ city: v })} options={CITIES.map((c) => [c, c])} placeholder="All cities" />
      <FilterSelect label="Brand" value={query.brand} onChange={(v) => apply({ brand: v })} options={brands.map((b) => [b.slug, b.name])} placeholder="All brands" />
      <FilterSelect label="Condition" value={query.condition} onChange={(v) => apply({ condition: v })} options={Object.entries(CONDITION_LABEL)} placeholder="Any condition" />
      <FilterSelect label="PTA status" value={query.pta} onChange={(v) => apply({ pta: v })} options={[['APPROVED', 'PTA approved'], ['NON_PTA', 'Non-PTA']]} placeholder="Any" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ minPrice, maxPrice });
        }}
      >
        <p className="text-label mb-1.5">Price (Rs)</p>
        <div className="flex items-center gap-2">
          <Input aria-label="Minimum price" inputMode="numeric" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ''))} />
          <span className="text-slate-400">–</span>
          <Input aria-label="Maximum price" inputMode="numeric" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ''))} />
        </div>
        <Button type="submit" variant="outline" size="sm" className="mt-2 w-full">Apply price</Button>
      </form>
    </div>
  );

  return (
    <SiteLayout title="Buy a used phone">
      <div className="border-b border-slate-200 bg-white">
        <div className="page-container py-8">
          <h1 className="text-2xl font-semibold sm:text-3xl">Used phones for sale</h1>
          <p className="mt-1 text-slate-600">Every listing can be inspected at a verified MobCheck shop before you pay.</p>
          <form
            role="search"
            className="mt-5 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              apply({ q: q.trim() || undefined });
            }}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <Input aria-label="Search phones" placeholder="Search by brand, model or title" value={q} onChange={(e) => setQ(e.target.value)} className="h-11 pl-9" />
            </div>
            <Button type="submit" size="lg" className="h-11">Search</Button>
          </form>
        </div>
      </div>

      <div className="page-container py-8 lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
        <aside className="hidden lg:block" aria-label="Filters">
          <h2 className="mb-4 text-sm font-semibold">Filters</h2>
          {filters}
        </aside>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <p className="text-sm text-slate-600" aria-live="polite">
              <span className="font-semibold text-ink">{total}</span> {total === 1 ? 'phone' : 'phones'}
            </p>
            <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen}>
              <SlidersHorizontal className="h-4 w-4" aria-hidden />Filters{active.length ? ` (${active.length})` : ''}
            </Button>
            <div className="ml-auto">
              <Select aria-label="Sort by" value={query.sort || ''} onChange={(e) => apply({ sort: e.target.value || undefined })} className="h-9 w-44">
                <option value="">Newest first</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
              </Select>
            </div>
          </div>

          {filtersOpen && <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 lg:hidden">{filters}</div>}

          {active.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {active.map((k) => (
                <button key={k} type="button" onClick={() => apply({ [k]: undefined })} className="inline-flex items-center gap-1 rounded-full bg-slate-200/70 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200">
                  {chipLabel(k, query[k]!, brands)}
                  <X className="h-3 w-3" aria-hidden /><span className="sr-only">Remove filter</span>
                </button>
              ))}
              <button type="button" onClick={() => router.push('/marketplace')} className="text-xs font-medium text-brand-700 hover:underline">Clear all</button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)}</div>
          ) : listings.length === 0 ? (
            <EmptyState icon={SearchX} title="No phones match your search" description="Try removing a filter or searching for a different model." action={active.length ? <Button variant="outline" onClick={() => router.push('/marketplace')}>Clear filters</Button> : undefined} />
          ) : (
            <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3')}>{listings.map((l) => <ListingCard key={l.id} listing={l} />)}</div>
          )}
          <Pagination page={page} pages={pages} />
        </div>
      </div>
    </SiteLayout>
  );
}

function FilterSelect({ label, value, onChange, options, placeholder }: { label: string; value?: string; onChange: (v: string | undefined) => void; options: [string, string][]; placeholder: string }) {
  return (
    <div>
      <label className="text-label mb-1.5 block" htmlFor={`f-${label}`}>{label}</label>
      <Select id={`f-${label}`} value={value || ''} onChange={(e) => onChange(e.target.value || undefined)}>
        <option value="">{placeholder}</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </Select>
    </div>
  );
}

function chipLabel(key: string, value: string, brands: { slug: string; name: string }[]) {
  if (key === 'brand') return brands.find((b) => b.slug === value)?.name || value;
  if (key === 'condition') return CONDITION_LABEL[value] || value;
  if (key === 'pta') return value === 'APPROVED' ? 'PTA approved' : 'Non-PTA';
  if (key === 'minPrice') return `Min Rs ${Number(value).toLocaleString()}`;
  if (key === 'maxPrice') return `Max Rs ${Number(value).toLocaleString()}`;
  if (key === 'q') return `"${value}"`;
  return value;
}
