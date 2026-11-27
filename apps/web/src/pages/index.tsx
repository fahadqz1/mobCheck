import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { ArrowRight, BadgeCheck, CalendarCheck, ClipboardCheck, FileCheck2, Search, ShieldCheck, Store } from 'lucide-react';
import prisma from '@/lib/prisma';
import { getSsrUser } from '@/lib/ssr-auth';
import { serialize } from '@/lib/serialize';
import { listingCardInclude } from '@/lib/queries';
import { toListingCard, type ListingCard as ListingCardData } from '@/lib/listing';
import { shopCardSelect, toShopCards } from '@/lib/shop';
import { getInspectionFee } from '@/lib/settings';
import { SiteLayout } from '@/components/layout/Layouts';
import { ListingCard } from '@/components/listings/ListingCard';
import { ShopCard, type ShopCardData } from '@/components/shops/ShopCard';
import { Button, LinkButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Form';
import { formatPKR } from '@/lib/format';

type Props = { listings: ListingCardData[]; shops: ShopCardData[]; fee: number; user: any };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const [listings, shops, fee, user] = await Promise.all([
    prisma.phoneListing.findMany({ where: { status: 'ACTIVE' }, include: listingCardInclude, orderBy: { listedAt: 'desc' }, take: 4 }),
    prisma.shop.findMany({ where: { status: 'VERIFIED' }, select: shopCardSelect, orderBy: { completedInspections: 'desc' }, take: 3 }),
    getInspectionFee(),
    getSsrUser(ctx),
  ]);
  return { props: serialize({ listings: listings.map(toListingCard), shops: await toShopCards(shops), fee, user }) };
};

const steps = [
  { icon: Search, title: 'Find a phone', text: 'Browse listings from sellers across Pakistan, or bring a phone you found elsewhere.' },
  { icon: CalendarCheck, title: 'Book an inspection', text: 'Pick a verified shop and a time. Pay online; the shop confirms your slot.' },
  { icon: ClipboardCheck, title: 'Get the facts', text: 'A trained inspector checks display, battery, cameras, IMEI, PTA status and locks.' },
  { icon: FileCheck2, title: 'Buy with confidence', text: 'Receive a report with photos and a number anyone can verify on MobCheck.' },
];

export default function Home({ listings, shops, fee }: Props) {
  const router = useRouter();
  const [q, setQ] = useState('');
  return (
    <SiteLayout title="Check before you buy">
      <section className="border-b border-slate-200 bg-white">
        <div className="page-container grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-800 ring-1 ring-brand-100">
              <ShieldCheck className="h-4 w-4" aria-hidden />Independent phone inspections in Pakistan
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">Check a used phone before you pay for it.</h1>
            <p className="mt-4 max-w-xl text-lg text-slate-600">
              Book a professional inspection at a verified shop for {formatPKR(fee)}. Get a detailed report with photos, PTA and IMEI checks before any money changes hands.
            </p>
            <form
              role="search"
              className="mt-8 flex max-w-xl gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                router.push({ pathname: '/marketplace', query: q.trim() ? { q: q.trim() } : {} });
              }}
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <Input aria-label="Search phones" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search iPhone 15 Pro, Galaxy S24…" className="h-12 pl-9 text-base" />
              </div>
              <Button type="submit" size="lg">Search</Button>
            </form>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Link href="/shops" className="link inline-flex items-center gap-1">Book an inspection <ArrowRight className="h-4 w-4" aria-hidden /></Link>
              <Link href="/listings/new" className="font-medium text-slate-600 hover:text-ink">Sell your phone</Link>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">What an inspection covers</p>
            <ul className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {['Display & touch', 'Battery health', 'Cameras', 'Speakers & mics', 'Network & Wi-Fi', 'Face ID / fingerprint', 'IMEI match', 'PTA status', 'iCloud / Google lock', 'Signs of repair'].map((item) => (
                <li key={item} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                  <BadgeCheck className="h-4 w-4 shrink-0 text-brand-700" aria-hidden />{item}
                </li>
              ))}
            </ul>
            <LinkButton href="/verify" variant="ghost" size="sm" className="mt-4">Already have a report? Verify it</LinkButton>
          </div>
        </div>
      </section>

      <section aria-labelledby="how" className="page-container py-16">
        <h2 id="how" className="text-2xl font-semibold">How MobCheck works</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-white"><s.icon className="h-5 w-5" aria-hidden /></span>
                <span className="text-sm font-medium text-slate-500">Step {i + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {listings.length > 0 && (
        <section aria-labelledby="latest" className="border-y border-slate-200 bg-white py-16">
          <div className="page-container">
            <div className="flex items-end justify-between gap-4">
              <h2 id="latest" className="text-2xl font-semibold">Latest phones</h2>
              <Link href="/marketplace" className="link inline-flex items-center gap-1 text-sm">View all <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{listings.map((l) => <ListingCard key={l.id} listing={l} />)}</div>
          </div>
        </section>
      )}

      {shops.length > 0 && (
        <section aria-labelledby="shops" className="page-container py-16">
          <div className="flex items-end justify-between gap-4">
            <h2 id="shops" className="text-2xl font-semibold">Verified inspection shops</h2>
            <Link href="/shops" className="link inline-flex items-center gap-1 text-sm">All shops <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{shops.map((s) => <ShopCard key={s.id} shop={s} />)}</div>
        </section>
      )}

      <section className="page-container pb-16">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-ink px-6 py-10 text-white sm:flex-row sm:items-center sm:px-10">
          <div className="flex items-start gap-4">
            <Store className="mt-1 h-8 w-8 shrink-0 text-brand-300" aria-hidden />
            <div>
              <h2 className="text-xl font-semibold text-white">Run a mobile shop?</h2>
              <p className="mt-1 max-w-xl text-slate-300">Earn from every inspection you perform and reach buyers who are ready to purchase. Free for the first 30 days.</p>
            </div>
          </div>
          <LinkButton href="/auth/register?role=SHOP_OWNER" variant="outline" size="lg" className="border-white">List your shop</LinkButton>
        </div>
      </section>
    </SiteLayout>
  );
}
