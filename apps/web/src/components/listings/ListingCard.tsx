import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, BadgeCheck, ClipboardCheck, Heart, MapPin, Smartphone } from 'lucide-react';
import { CONDITION_LABEL, formatPKR, PTA_LABEL, timeAgo } from '@/lib/format';
import type { ListingCard as ListingCardData } from '@/lib/listing';
import { useSaved } from '@/hooks/useSaved';
import { cn } from '@/lib/cn';

// Condition grades get their own colour so buyers can scan a grid quickly.
const GRADE: Record<string, { tile: string; chip: string }> = {
  BRAND_NEW: { tile: 'bg-tile-mint', chip: 'bg-brand-700 text-white' },
  LIKE_NEW: { tile: 'bg-tile-mint', chip: 'bg-brand-100 text-brand-900' },
  EXCELLENT: { tile: 'bg-tile-sky', chip: 'bg-sky-100 text-sky-900' },
  GOOD: { tile: 'bg-tile-butter', chip: 'bg-amber-100 text-amber-900' },
  FAIR: { tile: 'bg-tile-peach', chip: 'bg-orange-100 text-orange-900' },
  FOR_PARTS: { tile: 'bg-tile-rose', chip: 'bg-rose-100 text-rose-900' },
};

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(listing.id);
  const grade = GRADE[listing.condition] || GRADE.GOOD;
  return (
    <div className="group relative h-full">
      <Link
        href={`/listings/${listing.id}`}
        className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-2 shadow-card transition duration-300 hover:-translate-y-1 hover:border-ink/20 hover:shadow-raised"
        data-testid="listing-card"
      >
        <div className={cn('relative aspect-[4/3] overflow-hidden rounded-[20px]', listing.photoUrl ? 'bg-[#f1f2ee]' : grade.tile)}>
          {listing.photoUrl ? (
            <Image src={listing.photoUrl} alt={listing.title} fill sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.05]" loading="lazy" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1.5">
              <Smartphone className="h-9 w-9 text-ink/40" aria-hidden />
              <span className="text-xs font-medium text-ink/70">No photos yet</span>
            </div>
          )}
          <span className="glass absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-ink">
            <ClipboardCheck className="h-3.5 w-3.5" aria-hidden />
            Inspection available
          </span>
          <span className={cn('absolute bottom-2.5 left-2.5 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-card', grade.chip)}>{CONDITION_LABEL[listing.condition]}</span>
        </div>
        <div className="flex flex-1 flex-col px-2.5 pb-2.5 pt-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">{listing.brand}</p>
            {listing.ptaStatus === 'APPROVED' ? (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-brand-800"><BadgeCheck className="h-3.5 w-3.5" aria-hidden />PTA</span>
            ) : listing.ptaStatus === 'NON_PTA' ? (
              <span className="text-[11px] font-semibold text-amber-800">Non-PTA</span>
            ) : (
              <span className="text-[11px] text-slate-600">{PTA_LABEL[listing.ptaStatus]}</span>
            )}
          </div>
          <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-ink">{listing.title}</h3>
          <div className="mt-auto flex items-end justify-between gap-2 pt-3">
            <div className="min-w-0">
              <p className="font-display text-[22px] font-extrabold leading-none tracking-tight tabular-nums">{formatPKR(listing.pricePkr)}</p>
              <p className="mt-1.5 flex items-center gap-1 truncate text-xs text-slate-600">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">{listing.locationArea}, {listing.locationCity} · {/* Relative time can tick over between server render and hydration. */}<time dateTime={new Date(listing.listedAt).toISOString()} suppressHydrationWarning>{timeAgo(listing.listedAt)}</time></span>
              </p>
            </div>
            <span aria-hidden className="flex h-9 w-9 shrink-0 translate-x-1 items-center justify-center rounded-full bg-ink text-lime-300 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => toggle(listing.id)}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${listing.title} from saved phones` : `Save ${listing.title}`}
        className={cn('absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full shadow-card transition active:scale-90', saved ? 'bg-ink text-lime-300' : 'glass text-ink hover:bg-white')}
        data-testid="save-listing"
      >
        <Heart className={cn('h-4 w-4', saved && 'fill-current')} />
      </button>
    </div>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-2">
      <div className="aspect-[4/3] animate-pulse rounded-[20px] bg-slate-200/70" />
      <div className="space-y-2 p-2.5">
        <div className="h-3 w-16 animate-pulse rounded-full bg-slate-200/70" />
        <div className="h-4 w-full animate-pulse rounded-full bg-slate-200/70" />
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-200/70" />
        <div className="h-6 w-24 animate-pulse rounded-full bg-slate-200/70" />
      </div>
    </div>
  );
}
