import { useState } from 'react';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { BatteryMedium, Box, CalendarDays, ChevronRight, ClipboardCheck, Flag, Hash, MapPin, MessageCircle, MessageSquare, ShieldAlert, Store, Wrench } from 'lucide-react';
import prisma from '@/lib/prisma';
import { getSsrUser } from '@/lib/ssr-auth';
import { serialize } from '@/lib/serialize';
import { SiteLayout } from '@/components/layout/Layouts';
import { Gallery } from '@/components/media/Gallery';
import { ListingCard } from '@/components/listings/ListingCard';
import { Card } from '@/components/ui/Card';
import { Alert, Badge } from '@/components/ui/Feedback';
import { Button, LinkButton } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Field, Select, Textarea } from '@/components/ui/Form';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError } from '@/lib/client';
import { listingCardInclude } from '@/lib/queries';
import { toListingCard, type ListingCard as ListingCardData } from '@/lib/listing';
import { CONDITION_LABEL, fileUrl, formatDate, formatPKR, listingRef, PTA_LABEL, PTA_TONE, whatsappLink } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';

type Listing = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  pricePkr: number;
  condition: string;
  ptaStatus: string;
  storageGb: number | null;
  ramGb: number | null;
  color: string | null;
  batteryHealth: number | null;
  repairHistory: string | null;
  hasBox: boolean;
  hasCharger: boolean;
  hasAccessories: string[];
  locationCity: string;
  locationArea: string;
  listedAt: string;
  viewCount: number;
  sellerContactPreference: string;
  brand: { name: string };
  model: { name: string };
  photos: { id: string; url: string }[];
  shop: { name: string; slug: string; status: string } | null;
  seller: { id: string; name: string; memberSince: string; activeListings: number; rating: number | null; city: string | null; whatsapp: string | null };
};

type Props = { listing: Listing; similar: ListingCardData[]; isOwner: boolean; user: any };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const id = String(ctx.params?.id);
  const user = await getSsrUser(ctx);
  const l = await prisma.phoneListing.findUnique({
    where: { id },
    include: {
      brand: { select: { name: true } },
      model: { select: { name: true } },
      photos: { orderBy: [{ isPrimary: 'desc' }, { uploadSequence: 'asc' }], select: { id: true, storageKey: true } },
      shop: { select: { name: true, slug: true, status: true } },
      user: { select: { id: true, firstName: true, lastName: true, phone: true, createdAt: true, customerProfile: { select: { averageRating: true, city: true } } } },
    },
  });
  const isOwner = !!user && l?.userId === user.id;
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'OPS_ADMIN';
  if (!l || (!['ACTIVE', 'SOLD'].includes(l.status) && !isOwner && !isAdmin)) return { notFound: true };

  if (!isOwner) prisma.phoneListing.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  const [activeListings, sameModel] = await Promise.all([
    prisma.phoneListing.count({ where: { userId: l.userId, status: 'ACTIVE' } }),
    prisma.phoneListing.findMany({ where: { status: 'ACTIVE', id: { not: id }, modelId: l.modelId }, include: listingCardInclude, take: 4, orderBy: { listedAt: 'desc' } }),
  ]);
  const similar =
    sameModel.length >= 4
      ? sameModel
      : [
          ...sameModel,
          ...(await prisma.phoneListing.findMany({
            where: { status: 'ACTIVE', id: { notIn: [id, ...sameModel.map((s) => s.id)] }, brandId: l.brandId },
            include: listingCardInclude,
            take: 4 - sameModel.length,
            orderBy: { listedAt: 'desc' },
          })),
        ];

  const showWhatsapp = !!l.user.phone && l.sellerContactPreference !== 'PLATFORM';
  const listing: Listing = {
    id: l.id,
    title: l.title,
    description: l.description,
    status: l.status,
    pricePkr: Number(l.pricePkr),
    condition: l.condition,
    ptaStatus: l.ptaStatus,
    storageGb: l.storageGb,
    ramGb: l.ramGb,
    color: l.color,
    batteryHealth: l.batteryHealth,
    repairHistory: l.repairHistory,
    hasBox: l.hasBox,
    hasCharger: l.hasCharger,
    hasAccessories: l.hasAccessories,
    locationCity: l.locationCity,
    locationArea: l.locationArea,
    listedAt: l.listedAt.toISOString(),
    viewCount: l.viewCount,
    sellerContactPreference: l.sellerContactPreference,
    brand: l.brand,
    model: l.model,
    photos: l.photos.map((p) => ({ id: p.id, url: fileUrl(p.storageKey)! })),
    shop: l.shop,
    seller: {
      id: l.user.id,
      name: [l.user.firstName, l.user.lastName?.[0] ? `${l.user.lastName[0]}.` : ''].filter(Boolean).join(' ') || 'Seller',
      memberSince: l.user.createdAt.toISOString(),
      activeListings,
      rating: l.user.customerProfile?.averageRating ? Number(l.user.customerProfile.averageRating) : null,
      city: l.user.customerProfile?.city ?? null,
      // The number is only sent to signed-in visitors.
      whatsapp: showWhatsapp && user ? l.user.phone : showWhatsapp ? 'hidden' : null,
    },
  };
  return { props: serialize({ listing, similar: similar.map(toListingCard), isOwner, user }) };
};

export default function ListingDetail({ listing, similar, isOwner }: Props) {
  const { user } = useAuth();
  const [contactOpen, setContactOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const loginHref = `/auth/login?next=${encodeURIComponent(`/listings/${listing.id}`)}`;
  const name = `${listing.brand.name} ${listing.model.name}`;
  const sold = listing.status === 'SOLD';

  const specs: [string, React.ReactNode][] = [
    ['Brand', listing.brand.name],
    ['Model', listing.model.name],
    ['Storage', listing.storageGb ? `${listing.storageGb} GB` : 'Not stated'],
    ['RAM', listing.ramGb ? `${listing.ramGb} GB` : 'Not stated'],
    ['Colour', listing.color || 'Not stated'],
    ['Condition', CONDITION_LABEL[listing.condition]],
    ['PTA status', <Badge key="pta" tone={PTA_TONE[listing.ptaStatus]}>{PTA_LABEL[listing.ptaStatus]}</Badge>],
    ['Battery health', listing.batteryHealth ? `${listing.batteryHealth}% (seller stated)` : 'Not stated'],
  ];
  const accessories = [listing.hasBox && 'Original box', listing.hasCharger && 'Charger', ...listing.hasAccessories].filter(Boolean) as string[];

  return (
    <SiteLayout title={listing.title}>
      <div className="page-container py-6 sm:py-8">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-slate-600">
          <Link href="/marketplace" className="hover:text-ink">Phones</Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          <Link href={`/marketplace?q=${encodeURIComponent(listing.brand.name)}`} className="hover:text-ink">{listing.brand.name}</Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          <span className="truncate text-slate-700">{listing.model.name}</span>
        </nav>

        {sold && <Alert tone="info" title="This phone has been sold" className="mb-6">Browse similar phones below.</Alert>}
        {!['ACTIVE', 'SOLD'].includes(listing.status) && <Alert tone="warning" title={`This listing is ${listing.status.toLowerCase()}`} className="mb-6">Only you and MobCheck staff can see it.</Alert>}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-8">
            <Gallery images={listing.photos.map((p, i) => ({ id: p.id, url: p.url, alt: `${listing.title}, photo ${i + 1}` }))} emptyLabel="The seller hasn't uploaded photos yet" />

            <section aria-labelledby="specs">
              <h2 id="specs" className="text-lg font-semibold">Specifications</h2>
              <dl className="mt-3 grid overflow-hidden rounded-2xl border border-slate-200 bg-white sm:grid-cols-2">
                {specs.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 text-sm sm:[&:nth-last-child(-n+2)]:border-b-0">
                    <dt className="text-slate-600">{label}</dt>
                    <dd className="text-right font-medium text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-labelledby="desc" className="space-y-5">
              <div>
                <h2 id="desc" className="text-lg font-semibold">Seller&apos;s description</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{listing.description || 'The seller has not added a description.'}</p>
              </div>
              <InfoRow icon={Wrench} title="Repair history" text={listing.repairHistory || 'Not disclosed by the seller'} muted={!listing.repairHistory} />
              <InfoRow icon={Box} title="Included accessories" text={accessories.length ? accessories.join(', ') : 'None listed'} muted={!accessories.length} />
              <InfoRow icon={BatteryMedium} title="Battery" text={listing.batteryHealth ? `${listing.batteryHealth}% maximum capacity, as stated by the seller` : 'Battery health not stated'} muted={!listing.batteryHealth} />
              <p className="text-xs text-slate-600">Details on this page are provided by the seller and have not been checked by MobCheck. Book an inspection to have them verified.</p>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Card className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-600">{listing.brand.name}</p>
              <h1 className="mt-1 text-xl font-semibold leading-snug">{listing.title}</h1>
              <p className="mt-3 font-display text-4xl font-extrabold tracking-tight tabular-nums" data-testid="listing-price">{formatPKR(listing.pricePkr)}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge>{CONDITION_LABEL[listing.condition]}</Badge>
                <Badge tone={PTA_TONE[listing.ptaStatus]}>{PTA_LABEL[listing.ptaStatus]}</Badge>
                {listing.storageGb && <Badge>{listing.storageGb} GB</Badge>}
              </div>
              <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" aria-hidden />{listing.locationArea}, {listing.locationCity}</li>
                <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-slate-400" aria-hidden />Listed {formatDate(listing.listedAt)}</li>
                <li className="flex items-center gap-2"><Hash className="h-4 w-4 text-slate-400" aria-hidden />Ref <span className="font-mono text-xs">{listingRef(listing.id)}</span></li>
              </ul>

              {isOwner ? (
                <div className="mt-5 space-y-2">
                  <LinkButton href={`/dashboard/listings/${listing.id}`} className="w-full" size="lg">Manage listing</LinkButton>
                  <p className="text-center text-xs text-slate-600">{listing.viewCount} views</p>
                </div>
              ) : !sold ? (
                <div className="mt-5 grid gap-2">
                  {user ? (
                    <Button size="lg" onClick={() => setContactOpen(true)}><MessageSquare className="h-4 w-4" aria-hidden />Contact seller</Button>
                  ) : (
                    <LinkButton href={loginHref} size="lg"><MessageSquare className="h-4 w-4" aria-hidden />Log in to contact seller</LinkButton>
                  )}
                  {listing.seller.whatsapp && (
                    listing.seller.whatsapp === 'hidden' ? (
                      <LinkButton href={loginHref} variant="whatsapp" size="lg"><MessageCircle className="h-4 w-4" aria-hidden />Log in for WhatsApp</LinkButton>
                    ) : (
                      <a href={whatsappLink(listing.seller.whatsapp, `Hi, is your ${name} (${listingRef(listing.id)}) on MobCheck still available?`)} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#157a3f] px-6 text-base font-medium text-white hover:bg-[#106533]">
                        <MessageCircle className="h-4 w-4" aria-hidden />WhatsApp seller
                      </a>
                    )
                  )}
                  <LinkButton href={user ? `/bookings/new?listing=${listing.id}` : `/auth/login?next=${encodeURIComponent(`/bookings/new?listing=${listing.id}`)}`} variant="outline" size="lg">
                    <ClipboardCheck className="h-4 w-4" aria-hidden />Book a MobCheck inspection
                  </LinkButton>
                </div>
              ) : null}
            </Card>

            <Card className="p-5">
              <h2 className="text-sm font-semibold">About the seller</h2>
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={listing.seller.name} size="lg" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{listing.seller.name}</p>
                  <p className="text-xs text-slate-600">Member since {formatDate(listing.seller.memberSince)}</p>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-600">Active listings</dt><dd className="mt-0.5 font-semibold">{listing.seller.activeListings}</dd></div>
                <div className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-600">Seller rating</dt><dd className="mt-0.5 font-semibold">{listing.seller.rating ? `${listing.seller.rating.toFixed(1)} / 5` : 'No ratings yet'}</dd></div>
              </dl>
              {listing.shop && listing.shop.status === 'VERIFIED' && (
                <Link href={`/shops/${listing.shop.slug}`} className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm hover:bg-slate-50">
                  <Store className="h-4 w-4 text-slate-400" aria-hidden />Sold by <span className="font-medium">{listing.shop.name}</span>
                </Link>
              )}
            </Card>

            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>Never pay before seeing the phone. Meet in a public place, or book an inspection at a MobCheck shop.</p>
            </div>

            {!isOwner && (
              user ? (
                <button type="button" onClick={() => setReportOpen(true)} className="flex w-full items-center justify-center gap-1.5 py-1 text-sm text-slate-600 hover:text-red-700">
                  <Flag className="h-4 w-4" aria-hidden />Report this listing
                </button>
              ) : (
                <Link href={loginHref} className="flex w-full items-center justify-center gap-1.5 py-1 text-sm text-slate-600 hover:text-red-700">
                  <Flag className="h-4 w-4" aria-hidden />Log in to report this listing
                </Link>
              )
            )}
          </aside>
        </div>

        {similar.length > 0 && (
          <section aria-labelledby="similar" className="mt-14">
            <h2 id="similar" className="text-lg font-semibold">Similar phones</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((s) => <ListingCard key={s.id} listing={s} />)}
            </div>
          </section>
        )}
      </div>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} listingId={listing.id} name={name} />
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} listingId={listing.id} />
    </SiteLayout>
  );
}

function InfoRow({ icon: Icon, title, text, muted }: { icon: any; title: string; text: string; muted?: boolean }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Icon className="h-4 w-4" /></span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className={muted ? 'text-sm text-slate-600' : 'text-sm text-slate-700'}>{text}</p>
      </div>
    </div>
  );
}

function ContactModal({ open, onClose, listingId, name }: { open: boolean; onClose: () => void; listingId: string; name: string }) {
  const [message, setMessage] = useState(`Hi, is your ${name} still available? I'd like to see it.`);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const send = async () => {
    setSending(true);
    setError('');
    try {
      await api(`/api/listings/${listingId}/inquiries`, { body: { message } });
      setSent(true);
    } catch (err) {
      setError((err as ApiError).fields?.message || (err as ApiError).message);
    } finally {
      setSending(false);
    }
  };
  const close = () => {
    onClose();
    setTimeout(() => setSent(false), 200);
  };
  return (
    <Modal
      open={open}
      onClose={close}
      title={sent ? 'Message sent' : 'Contact the seller'}
      description={sent ? undefined : 'The seller will see your name and email address and reply to you directly.'}
      footer={sent ? <Button onClick={close}>Done</Button> : (<><Button variant="outline" onClick={close}>Cancel</Button><Button onClick={send} loading={sending}>Send message</Button></>)}
    >
      {sent ? (
        <Alert tone="success" title="Your message is with the seller">You&apos;ll hear back by email or phone. Don&apos;t pay anything before seeing the phone.</Alert>
      ) : (
        <Field label="Message" error={error}>{(p) => <Textarea {...p} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} />}</Field>
      )}
    </Modal>
  );
}

const REPORT_REASONS = [
  ['SUSPECTED_SCAM', 'Looks like a scam'],
  ['STOLEN_DEVICE', 'Possibly stolen phone'],
  ['MISLEADING_DETAILS', 'Misleading details or photos'],
  ['WRONG_PRICE', 'Price is clearly wrong'],
  ['ALREADY_SOLD', 'Already sold'],
  ['OFFENSIVE', 'Offensive content'],
  ['OTHER', 'Something else'],
];

function ReportModal({ open, onClose, listingId }: { open: boolean; onClose: () => void; listingId: string }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const submit = async () => {
    setSending(true);
    setFields({});
    setError('');
    try {
      await api(`/api/listings/${listingId}/report`, { body: { reason, details: details || undefined } });
      toast('success', 'Thanks. Our team will review this listing.');
      onClose();
    } catch (err) {
      setFields((err as ApiError).fields || {});
      setError((err as ApiError).fields ? '' : (err as ApiError).message);
    } finally {
      setSending(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose} title="Report this listing" description="Reports are confidential. The seller is not told who reported them." footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant="danger" onClick={submit} loading={sending}>Submit report</Button></>}>
      <div className="space-y-4">
        {error && <Alert tone="danger" title={error} />}
        <Field label="Reason" error={fields.reason} required>
          {(p) => (
            <Select {...p} value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="">Choose a reason</option>
              {REPORT_REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Details" hint="Optional. Anything that helps us review it." error={fields.details}>{(p) => <Textarea {...p} rows={3} value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} />}</Field>
      </div>
    </Modal>
  );
}
