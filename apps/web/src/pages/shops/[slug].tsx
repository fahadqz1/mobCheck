import { useState } from 'react';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { BadgeCheck, CalendarDays, ClipboardCheck, Clock, Flag, Mail, MapPin, MessageCircle, Phone, ShieldAlert, Users, Wrench } from 'lucide-react';
import prisma from '@/lib/prisma';
import { getSsrUser } from '@/lib/ssr-auth';
import { serialize } from '@/lib/serialize';
import { getInspectionFee } from '@/lib/settings';
import { SiteLayout } from '@/components/layout/Layouts';
import { ShopCover, ShopLogo } from '@/components/shops/ShopCard';
import { Gallery } from '@/components/media/Gallery';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Alert, Badge, EmptyState } from '@/components/ui/Feedback';
import { LinkButton } from '@/components/ui/Button';
import { Rating, Stars } from '@/components/ui/Rating';
import { ComplaintModal } from '@/components/shops/ComplaintModal';
import { fileUrl, formatDate, formatPKR, SHOP_STATUS, whatsappLink } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';

type Review = { id: string; overallRating: number; reviewText: string | null; wouldRecommend: boolean | null; createdAt: string; author: string; device: string };
type Shop = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  verifiedAt: string | null;
  city: string;
  area: string;
  addressLine1: string;
  addressLine2: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  whatsapp: string | null;
  email: string;
  openingHour: string | null;
  closingHour: string | null;
  weeklyHolidays: string[];
  logoUrl: string | null;
  coverUrl: string | null;
  gallery: string[];
  averageRating: number | null;
  totalReviews: number;
  completedInspections: number;
  services: { id: string; name: string; description: string | null; pricePkr: number }[];
  inspectors: number;
  availableDays: string[];
};
type Props = { shop: Shop; reviews: Review[]; breakdown: Record<number, number>; fee: number; isOwner: boolean; user: any };

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const DAY_FLAGS = ['availableMonday', 'availableTuesday', 'availableWednesday', 'availableThursday', 'availableFriday', 'availableSaturday', 'availableSunday'] as const;

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const user = await getSsrUser(ctx);
  const s = await prisma.shop.findUnique({
    where: { slug: String(ctx.params?.slug) },
    include: {
      services: { where: { status: 'ACTIVE' }, orderBy: { pricePkr: 'asc' } },
      inspectors: { where: { status: 'ACTIVE' }, select: { availableMonday: true, availableTuesday: true, availableWednesday: true, availableThursday: true, availableFriday: true, availableSaturday: true, availableSunday: true } },
    },
  });
  const isOwner = !!user && s?.ownerId === user.id;
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'OPS_ADMIN';
  if (!s || (s.status !== 'VERIFIED' && !isOwner && !isAdmin)) return { notFound: true };

  const [reviews, grouped, fee] = await Promise.all([
    prisma.review.findMany({
      where: { shopId: s.id, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { customer: { select: { firstName: true, lastName: true } }, booking: { select: { brand: { select: { name: true } }, model: { select: { name: true } } } } },
    }),
    prisma.review.groupBy({ by: ['overallRating'], where: { shopId: s.id, status: 'PUBLISHED' }, _count: true }),
    getInspectionFee(),
  ]);
  const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  grouped.forEach((g) => (breakdown[g.overallRating] = g._count));
  const totalReviews = grouped.reduce((n, g) => n + g._count, 0);
  const averageRating = totalReviews ? grouped.reduce((sum, g) => sum + g.overallRating * g._count, 0) / totalReviews : null;
  const availableDays = DAYS.filter((_, i) => s.inspectors.some((ins) => ins[DAY_FLAGS[i]]) && !s.weeklyHolidays.includes(DAYS[i]));

  const shop: Shop = {
    id: s.id,
    slug: s.slug,
    name: s.name,
    description: s.description,
    status: s.status,
    verifiedAt: s.verifiedAt?.toISOString() ?? null,
    city: s.city,
    area: s.area,
    addressLine1: s.addressLine1,
    addressLine2: s.addressLine2,
    latitude: s.latitude ? Number(s.latitude) : null,
    longitude: s.longitude ? Number(s.longitude) : null,
    phone: s.phone,
    whatsapp: s.whatsapp,
    email: s.email,
    openingHour: s.openingHour,
    closingHour: s.closingHour,
    weeklyHolidays: s.weeklyHolidays,
    logoUrl: fileUrl(s.logoUrl),
    coverUrl: fileUrl(s.coverUrl),
    gallery: s.galleryUrls.map((k) => fileUrl(k)!),
    averageRating,
    totalReviews,
    completedInspections: s.completedInspections,
    services: s.services.map((x) => ({ id: x.id, name: x.name, description: x.description, pricePkr: Number(x.pricePkr) })),
    inspectors: s.inspectors.length,
    availableDays,
  };
  return {
    props: serialize({
      shop,
      reviews: reviews.map((r) => ({
        id: r.id,
        overallRating: r.overallRating,
        reviewText: r.reviewText,
        wouldRecommend: r.wouldRecommend,
        createdAt: r.createdAt.toISOString(),
        author: [r.customer.firstName, r.customer.lastName?.[0] ? `${r.customer.lastName[0]}.` : ''].filter(Boolean).join(' ') || 'Customer',
        device: `${r.booking.brand.name} ${r.booking.model.name}`,
      })),
      breakdown,
      fee,
      isOwner,
      user,
    }),
  };
};

export default function ShopProfile({ shop, reviews, breakdown, fee, isOwner }: Props) {
  const { user } = useAuth();
  const [complaintOpen, setComplaintOpen] = useState(false);
  const bookHref = `/bookings/new?shop=${shop.slug}`;
  const verified = shop.status === 'VERIFIED';
  const mapsHref = shop.latitude && shop.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.name}, ${shop.addressLine1}, ${shop.area}, ${shop.city}`)}`;
  const canBook = verified && shop.inspectors > 0 && !isOwner;

  return (
    <SiteLayout title={shop.name}>
      <ShopCover url={shop.coverUrl} name={shop.name} className="h-40 sm:h-56" />
      <div className="page-container">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <ShopLogo name={shop.name} url={shop.logoUrl} className="-mt-10 h-20 w-20 text-2xl sm:-mt-12 sm:h-24 sm:w-24" />
            <div className="pb-1 pt-3">
              <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold sm:text-3xl">
                {shop.name}
                {verified ? (
                  <Badge tone="success"><BadgeCheck className="h-3.5 w-3.5" aria-hidden />Verified by MobCheck</Badge>
                ) : (
                  <Badge tone={SHOP_STATUS[shop.status].tone}>{SHOP_STATUS[shop.status].label}</Badge>
                )}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 text-slate-400" aria-hidden />{shop.area}, {shop.city}</span>
                <Rating value={shop.averageRating} count={shop.totalReviews} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:pb-1">
            {isOwner ? (
              <LinkButton href="/vendor/shop">Edit shop profile</LinkButton>
            ) : (
              <>
                {shop.whatsapp && (
                  <a href={whatsappLink(shop.whatsapp, `Hi ${shop.name}, I found you on MobCheck and want to book an inspection.`)} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#157a3f] px-4 text-sm font-medium text-white hover:bg-[#106533]">
                    <MessageCircle className="h-4 w-4" aria-hidden />WhatsApp
                  </a>
                )}
                {canBook && (
                  <LinkButton href={user ? bookHref : `/auth/login?next=${encodeURIComponent(bookHref)}`}><ClipboardCheck className="h-4 w-4" aria-hidden />Book inspection</LinkButton>
                )}
              </>
            )}
          </div>
        </div>
        {!verified && <Alert tone="warning" title="This shop is not public yet" className="mt-6">Only the owner and MobCheck staff can see this page until the shop is verified.</Alert>}

        <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-8">
            <section aria-labelledby="about">
              <h2 id="about" className="text-lg font-semibold">About</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{shop.description || 'This shop has not added a description yet.'}</p>
            </section>

            <section aria-labelledby="pricing">
              <h2 id="pricing" className="text-lg font-semibold">Services & pricing</h2>
              <Card className="mt-3">
                <ul className="divide-y divide-slate-100">
                  <li className="flex items-start justify-between gap-4 px-5 py-4">
                    <div>
                      <p className="flex items-center gap-2 font-medium"><ClipboardCheck className="h-4 w-4 text-brand-700" aria-hidden />MobCheck device inspection</p>
                      <p className="mt-0.5 text-sm text-slate-600">Full checklist with photo evidence and a verifiable report. Paid online through MobCheck.</p>
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums">{formatPKR(fee)}</p>
                  </li>
                  {shop.services.map((s) => (
                    <li key={s.id} className="flex items-start justify-between gap-4 px-5 py-4">
                      <div>
                        <p className="flex items-center gap-2 font-medium"><Wrench className="h-4 w-4 text-slate-400" aria-hidden />{s.name}</p>
                        {s.description && <p className="mt-0.5 text-sm text-slate-600">{s.description}</p>}
                      </div>
                      <p className="shrink-0 font-semibold tabular-nums">{s.pricePkr > 0 ? formatPKR(s.pricePkr) : 'On inspection'}</p>
                    </li>
                  ))}
                </ul>
                {shop.services.length === 0 && <p className="border-t border-slate-100 px-5 py-3 text-sm text-slate-600">This shop hasn&apos;t listed its repair services yet.</p>}
              </Card>
            </section>

            {shop.gallery.length > 0 && (
              <section aria-labelledby="gallery">
                <h2 id="gallery" className="mb-3 text-lg font-semibold">Shop photos</h2>
                <Gallery images={shop.gallery.map((url, i) => ({ id: url, url, alt: `${shop.name} photo ${i + 1}` }))} />
              </section>
            )}

            <section aria-labelledby="reviews">
              <h2 id="reviews" className="text-lg font-semibold">Customer reviews</h2>
              <p className="mt-1 text-sm text-slate-600">Only customers who completed a paid inspection here can leave a review.</p>
              {reviews.length === 0 ? (
                <EmptyState title="No reviews yet" description="Reviews appear after customers complete an inspection at this shop." className="mt-4" />
              ) : (
                <>
                  <div className="mt-4 grid gap-6 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-[160px_1fr]">
                    <div>
                      <p className="text-4xl font-semibold">{shop.averageRating?.toFixed(1)}</p>
                      <Stars value={shop.averageRating || 0} size="md" />
                      <p className="mt-1 text-sm text-slate-600">{shop.totalReviews} reviews</p>
                    </div>
                    <ul className="space-y-1.5">
                      {[5, 4, 3, 2, 1].map((n) => {
                        const pct = shop.totalReviews ? Math.round(((breakdown[n] || 0) / shop.totalReviews) * 100) : 0;
                        return (
                          <li key={n} className="flex items-center gap-3 text-sm">
                            <span className="w-3 text-slate-600">{n}</span>
                            <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} /></span>
                            <span className="w-8 text-right text-slate-600">{breakdown[n] || 0}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <ul className="mt-4 space-y-3">
                    {reviews.map((r) => (
                      <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2"><Stars value={r.overallRating} /><span className="text-sm font-medium">{r.author}</span></div>
                          <span className="text-xs text-slate-600">{formatDate(r.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">Inspected: {r.device}{r.wouldRecommend ? ' · Recommends this shop' : ''}</p>
                        {r.reviewText && <p className="mt-2 text-sm text-slate-700">{r.reviewText}</p>}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader title="Visit or contact" />
              <CardBody className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <div>
                    <p>{shop.addressLine1}</p>
                    {shop.addressLine2 && <p>{shop.addressLine2}</p>}
                    <p>{shop.area}, {shop.city}</p>
                    <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="link mt-1 inline-block">Open in Google Maps</a>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <div>
                    <p>{shop.openingHour && shop.closingHour ? `${shop.openingHour} – ${shop.closingHour}` : 'Hours not listed'}</p>
                    <p className="text-slate-600">{shop.weeklyHolidays.length ? `Closed ${shop.weeklyHolidays.join(', ')}` : 'Open every day'}</p>
                  </div>
                </div>
                <a href={`tel:${shop.phone}`} className="flex gap-3 hover:text-brand-800"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />{shop.phone}</a>
                <a href={`mailto:${shop.email}`} className="flex gap-3 break-all hover:text-brand-800"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />{shop.email}</a>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Booking availability" />
              <CardBody className="space-y-3 text-sm">
                <p className="flex items-center gap-2"><Users className="h-4 w-4 text-slate-400" aria-hidden />{shop.inspectors} active {shop.inspectors === 1 ? 'inspector' : 'inspectors'}</p>
                <p className="flex items-start gap-2"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />{shop.availableDays.length ? `Inspections on ${shop.availableDays.map((d) => d.slice(0, 3)).join(', ')}` : 'No inspection days available right now'}</p>
                <p className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-slate-400" aria-hidden />{shop.completedInspections} inspections completed</p>
                {canBook ? (
                  <LinkButton href={user ? bookHref : `/auth/login?next=${encodeURIComponent(bookHref)}`} className="w-full">Book an inspection · {formatPKR(fee)}</LinkButton>
                ) : !isOwner && verified ? (
                  <Alert tone="info">This shop isn&apos;t taking bookings yet because no inspector is available.</Alert>
                ) : null}
              </CardBody>
            </Card>

            {verified && (
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                <p>Verified {shop.verifiedAt ? `on ${formatDate(shop.verifiedAt)}` : ''}: MobCheck checked this shop&apos;s business documents and owner ID.</p>
              </div>
            )}

            {!isOwner && (
              user ? (
                <button type="button" onClick={() => setComplaintOpen(true)} className="flex w-full items-center justify-center gap-1.5 py-1 text-sm text-slate-600 hover:text-red-700"><Flag className="h-4 w-4" aria-hidden />Report a problem with this shop</button>
              ) : (
                <Link href={`/auth/login?next=${encodeURIComponent(`/shops/${shop.slug}`)}`} className="flex w-full items-center justify-center gap-1.5 py-1 text-sm text-slate-600 hover:text-red-700"><Flag className="h-4 w-4" aria-hidden />Log in to report a problem</Link>
              )
            )}
          </aside>
        </div>
      </div>
      <ComplaintModal open={complaintOpen} onClose={() => setComplaintOpen(false)} shopId={shop.id} shopName={shop.name} />
    </SiteLayout>
  );
}

