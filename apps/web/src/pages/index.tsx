import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { ArrowRight, BadgeCheck, Banknote, Camera, Clock, FileCheck2, QrCode, Search, ShieldCheck, Sparkles, Star } from 'lucide-react';
import prisma from '@/lib/prisma';
import { getSsrUser } from '@/lib/ssr-auth';
import { serialize } from '@/lib/serialize';
import { listingCardInclude } from '@/lib/queries';
import { toListingCard, type ListingCard as ListingCardData } from '@/lib/listing';
import { shopCardSelect, toShopCards } from '@/lib/shop';
import { getInspectionFee } from '@/lib/settings';
import { SiteLayout } from '@/components/layout/Layouts';
import { ListingCard, ListingCardSkeleton } from '@/components/listings/ListingCard';
import { ShopCard, type ShopCardData } from '@/components/shops/ShopCard';
import { Carousel } from '@/components/ui/Carousel';
import { LiquidTabs } from '@/components/ui/LiquidTabs';
import { LinkButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { Stars } from '@/components/ui/Rating';
import { FoldArt, PhoneArt, PhoneBackArt, ReportArt, ShopArt } from '@/components/media/DeviceArt';
import { useSheen } from '@/hooks/useSheen';
import { HeroMascot } from '@/components/home/HeroMascot';
import { api } from '@/lib/client';
import { formatPKR } from '@/lib/format';
import { cn } from '@/lib/cn';

type Brand = { slug: string; name: string; count: number };
type Review = { id: string; rating: number; text: string; author: string; device: string; shop: string };
type Props = { listings: ListingCardData[]; shops: ShopCardData[]; brands: Brand[]; reviews: Review[]; fee: number; checks: number; user: any };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const [listings, shops, brands, reviews, fee, checks, user] = await Promise.all([
    prisma.phoneListing.findMany({ where: { status: 'ACTIVE' }, include: listingCardInclude, orderBy: { listedAt: 'desc' }, take: 10 }),
    prisma.shop.findMany({ where: { status: 'VERIFIED' }, select: shopCardSelect, orderBy: { completedInspections: 'desc' }, take: 8 }),
    prisma.brand.findMany({ select: { slug: true, name: true, _count: { select: { listings: { where: { status: 'ACTIVE' } } } } }, orderBy: { name: 'asc' } }),
    prisma.review.findMany({
      where: { status: 'PUBLISHED', reviewText: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { customer: { select: { firstName: true, lastName: true } }, shop: { select: { name: true } }, booking: { select: { brand: { select: { name: true } }, model: { select: { name: true } } } } },
    }),
    getInspectionFee(),
    prisma.inspectionChecklist.count({ where: { deviceType: 'IPHONE', status: 'ACTIVE' } }),
    getSsrUser(ctx),
  ]);
  return {
    props: serialize({
      listings: listings.map(toListingCard),
      shops: await toShopCards(shops),
      brands: brands.map((b) => ({ slug: b.slug, name: b.name, count: b._count.listings })),
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.overallRating,
        text: r.reviewText || '',
        author: [r.customer.firstName, r.customer.lastName?.[0] ? `${r.customer.lastName[0]}.` : ''].filter(Boolean).join(' '),
        device: `${r.booking.brand.name} ${r.booking.model.name}`,
        shop: r.shop.name,
      })),
      fee,
      checks,
      user,
    }),
  };
};

const BRAND_STYLE: Record<string, { tile: string; art: React.ReactNode }> = {
  apple: { tile: 'bg-tile-sky', art: <PhoneBackArt className="h-24" tone="#e8e2d8" /> },
  samsung: { tile: 'bg-tile-lilac', art: <PhoneArt className="h-24" /> },
  'google-pixel': { tile: 'bg-tile-mint', art: <PhoneBackArt className="h-24" tone="#f4f1ea" lens="#334155" /> },
  oneplus: { tile: 'bg-tile-rose', art: <PhoneBackArt className="h-24" tone="#1f2937" lens="#94a3b8" /> },
};

const FILTERS = [
  { value: 'new', label: 'Newest', icon: Sparkles, query: '' },
  { value: 'budget', label: 'Under Rs 200k', icon: Banknote, query: 'maxPrice=200000&sort=price_asc' },
  { value: 'pta', label: 'PTA approved', icon: BadgeCheck, query: 'pta=APPROVED' },
  { value: 'likenew', label: 'Like new', icon: Star, query: 'condition=LIKE_NEW' },
];

export default function Home({ listings, shops, brands, reviews, fee, checks }: Props) {
  const router = useRouter();
  const sheen = useSheen();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('new');
  const [items, setItems] = useState<ListingCardData[]>(listings);
  const [loading, setLoading] = useState(false);
  // Server already rendered the "new" tab; only fetch when the selected tab actually changes.
  const shownFilter = useRef('new');

  useEffect(() => {
    if (filter === shownFilter.current) return;
    shownFilter.current = filter;
    let cancelled = false;
    setLoading(true);
    const query = FILTERS.find((f) => f.value === filter)!.query;
    api<{ data: ListingCardData[] }>(`/api/listings${query ? `?${query}` : ''}`)
      .then((r) => !cancelled && setItems(r.data.slice(0, 10)))
      .catch(() => !cancelled && setItems([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const promise = [
    { icon: FileCheck2, title: `${checks}-point inspection`, text: 'Display, battery, cameras, network, sensors, IMEI and locks.' },
    { icon: Camera, title: 'Photo evidence', text: 'Every defect is photographed and attached to the report.' },
    { icon: QrCode, title: 'Verifiable reports', text: 'Each report has a number and QR code anyone can check.' },
    { icon: ShieldCheck, title: 'Refund if declined', text: 'If the shop can’t take your booking, you’re refunded in full.' },
  ];

  return (
    <SiteLayout title="Check before you buy">
      {/* Hero */}
      <section className="page-container pt-6 sm:pt-8">
        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <div className="relative overflow-hidden rounded-[32px] bg-lime-300 px-6 py-10 sm:px-10 sm:py-14">
            <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/40 blur-3xl" />
            <p className="relative inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-lime-300">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />Pakistan&apos;s phone inspection marketplace
            </p>
            <h1 className="display relative mt-5 max-w-xl text-[44px] leading-[0.95] sm:text-6xl lg:text-[72px]">Check it.<br />Then buy it.</h1>
            <p className="relative mt-5 max-w-md text-base text-ink/80 sm:text-lg">
              Have any used phone inspected by a verified shop for {formatPKR(fee)}, with photos, PTA and IMEI checks, before your money moves.
            </p>
            <form
              role="search"
              className="relative mt-7 flex max-w-lg gap-2 rounded-full bg-white p-1.5 shadow-raised"
              onSubmit={(e) => {
                e.preventDefault();
                router.push({ pathname: '/marketplace', query: q.trim() ? { q: q.trim() } : {} });
              }}
            >
              <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" aria-hidden />
              <input aria-label="Search phones" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Which phone are you after?" className="h-11 min-w-0 flex-1 rounded-full bg-transparent pl-10 pr-2 text-[15px] text-ink placeholder:text-slate-600 focus:outline-none" />
              <button type="submit" className="h-11 shrink-0 rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.97]">Search</button>
            </form>
            <div className="relative mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
              <Link href="/shops" className="inline-flex items-center gap-1 underline decoration-ink/30 underline-offset-4 hover:decoration-ink">Book an inspection <ArrowRight className="h-4 w-4" aria-hidden /></Link>
              <Link href="/listings/new" className="underline decoration-ink/30 underline-offset-4 hover:decoration-ink">Sell your phone</Link>
            </div>
          </div>

          <HeroMascot checks={checks} />
        </div>
      </section>

      {/* Brands */}
      <section className="page-container pt-14">
        <Carousel label="Shop by brand" title="Shop our most wanted" itemClassName="w-[42%] sm:w-[28%] lg:w-[16%]">
          {[
            ...brands.map((b) => (
              <BrandTile key={b.slug} href={`/marketplace?brand=${b.slug}`} label={b.name === 'Apple' ? 'iPhone' : b.name} sub={`${b.count} ${b.count === 1 ? 'phone' : 'phones'}`} tile={BRAND_STYLE[b.slug]?.tile || 'bg-tile-butter'} art={BRAND_STYLE[b.slug]?.art || <PhoneArt className="h-24" />} />
            )),
            <BrandTile key="pta" href="/marketplace?pta=APPROVED" label="PTA approved" sub="Ready for any SIM" tile="bg-tile-butter" art={<PhoneArt className="h-24" tone="#064e3b" />} />,
            <BrandTile key="fold" href="/marketplace?sort=price_desc" label="Flagships" sub="Top of the range" tile="bg-tile-peach" art={<FoldArt className="h-24" />} />,
          ]}
        </Carousel>
      </section>

      {/* Promo panels */}
      <section className="page-container grid gap-4 pt-14 md:grid-cols-2">
        <Promo tone="bg-lime-300" art={<ReportArt className="h-32 sm:h-40" />} title={<>Inspect before you pay<br />for just {formatPKR(fee)}</>} text="Pick a verified shop, choose a time and get a report with photos." cta={{ href: '/shops', label: 'Find an inspection shop' }} />
        <Promo tone="bg-tile-lilac" art={<PhoneBackArt className="h-32 sm:h-40" tone="#e8e2d8" />} title={<>Sell your phone<br />in three minutes</>} text="Free listings. Add photos, set your price and let buyers book an inspection." cta={{ href: '/listings/new', label: 'Sell a phone' }} />
      </section>

      {/* Fresh listings with liquid tabs */}
      <section className="page-container pt-14" aria-labelledby="fresh">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="fresh" className="text-2xl font-bold sm:text-[28px]">Fresh on MobCheck</h2>
          <LiquidTabs label="Filter phones" tabs={FILTERS} value={filter} onChange={setFilter} />
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)}</div>
        ) : items.length === 0 ? (
          <EmptyState title="Nothing here right now" description="Try another filter, or check back soon." action={<LinkButton href="/marketplace" variant="secondary">Browse all phones</LinkButton>} />
        ) : (
          <Carousel label="Phones" action={<Link href="/marketplace" className="link text-sm">View all</Link>}>
            {items.map((l) => <ListingCard key={l.id} listing={l} />)}
          </Carousel>
        )}
      </section>

      {/* Promise */}
      <section className="page-container pt-14" aria-labelledby="promise">
        <div className="relative overflow-hidden rounded-[32px] bg-tile-mint p-6 sm:p-10">
          <div aria-hidden className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-lime-300/70 blur-3xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <h2 id="promise" className="max-w-md text-2xl font-bold sm:text-[28px]">The MobCheck promise: buy used, without the risk</h2>
            <LinkButton href="/shops" variant="primary">Book an inspection</LinkButton>
          </div>
          <ul className="relative mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {promise.map((p) => (
              <li key={p.title} onPointerMove={sheen} className="glass liquid-sheen rounded-3xl p-4 transition duration-300 hover:-translate-y-1 sm:p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ink text-lime-300"><p.icon className="h-5 w-5" aria-hidden /></span>
                <h3 className="mt-4 font-semibold">{p.title}</h3>
                <p className="mt-1 text-sm text-slate-700">{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="page-container pt-14" aria-labelledby="how">
        <h2 id="how" className="text-2xl font-bold sm:text-[28px]">How it works</h2>
        <ol className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[
            ['Find a phone', 'On MobCheck or anywhere else: OLX, a friend, a market stall.'],
            ['Book a shop', `Choose a verified shop and a time. Pay ${formatPKR(fee)} online.`],
            ['Get inspected', 'The inspector checks every item on the list and photographs defects.'],
            ['Decide with facts', 'Read the report, confirm or dispute it, then buy with confidence.'],
          ].map(([title, text], i) => (
            <li key={title} className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-card sm:p-6">
              <span className="font-display text-4xl font-extrabold text-lime-600 sm:text-5xl">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {shops.length > 0 && (
        <section className="page-container pt-14">
          <Carousel label="Verified shops" title="Verified inspection shops" itemClassName="w-[82%] sm:w-[46%] lg:w-[32%]" action={<Link href="/shops" className="link text-sm">All shops</Link>}>
            {shops.map((s) => <ShopCard key={s.id} shop={s} />)}
          </Carousel>
        </section>
      )}

      {reviews.length > 0 && (
        <section className="page-container pt-14">
          <Carousel label="Customer reviews" title="What buyers say" itemClassName="w-[82%] sm:w-[46%] lg:w-[32%]">
            {reviews.map((r) => (
              <figure key={r.id} className="flex h-full flex-col rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card">
                <Stars value={r.rating} />
                <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-slate-800">“{r.text}”</blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold">{r.author}</span>
                  <span className="text-slate-600"> · {r.device} at {r.shop}</span>
                </figcaption>
              </figure>
            ))}
          </Carousel>
        </section>
      )}

      {/* Shop CTA */}
      <section className="page-container py-14">
        <div className="relative overflow-hidden rounded-[32px] bg-ink px-6 py-10 sm:px-10">
          <div aria-hidden className="absolute -bottom-20 right-10 h-64 w-64 rounded-full bg-lime-300/50 blur-3xl" />
          <div aria-hidden className="absolute -top-16 left-1/3 h-52 w-52 rounded-full bg-[#9b8cf2]/40 blur-3xl" />
          <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div className="glass-dark max-w-xl rounded-3xl p-6">
              <div className="flex items-center gap-2 text-lime-300"><Clock className="h-4 w-4" aria-hidden /><span className="text-xs font-semibold uppercase tracking-wider">Free for 30 days</span></div>
              <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">Run a mobile shop?</h2>
              <p className="mt-2 text-slate-300">Earn from every inspection you perform and reach buyers who are ready to purchase.</p>
              <LinkButton href="/auth/register?role=SHOP_OWNER" variant="accent" size="lg" className="mt-6">List your shop</LinkButton>
            </div>
            <ShopArt className="hidden h-40 md:block" />
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function BrandTile({ href, label, sub, tile, art }: { href: string; label: string; sub: string; tile: string; art: React.ReactNode }) {
  return (
    <Link href={href} className="group block text-center">
      <span className={cn('flex aspect-square items-center justify-center rounded-3xl transition duration-300 group-hover:-translate-y-1 group-hover:shadow-raised', tile)}>
        <span className="transition duration-300 group-hover:scale-105">{art}</span>
      </span>
      <span className="mt-2 block text-sm font-semibold">{label}</span>
      <span className="block text-xs text-slate-600">{sub}</span>
    </Link>
  );
}

function Promo({ tone, art, title, text, cta }: { tone: string; art: React.ReactNode; title: React.ReactNode; text: string; cta: { href: string; label: string } }) {
  return (
    <div className={cn('group relative flex items-center gap-4 overflow-hidden rounded-[32px] p-6 sm:p-8', tone)}>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-2xl font-extrabold leading-tight sm:text-[28px]">{title}</h2>
        <p className="mt-2 max-w-xs text-sm text-ink/75">{text}</p>
        <LinkButton href={cta.href} variant="primary" className="mt-5">{cta.label}</LinkButton>
      </div>
      <div className="shrink-0 transition duration-500 group-hover:-rotate-3 group-hover:scale-105">{art}</div>
    </div>
  );
}
