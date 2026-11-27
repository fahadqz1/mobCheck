import Image from 'next/image';
import Link from 'next/link';
import { ClipboardCheck, MapPin, Smartphone } from 'lucide-react';
import { Badge } from '@/components/ui/Feedback';
import { CONDITION_LABEL, formatPKR, PTA_LABEL, PTA_TONE, timeAgo } from '@/lib/format';
import type { ListingCard as ListingCardData } from '@/lib/listing';

export function ListingCard({ listing }: { listing: ListingCardData }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-2 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-raised"
      data-testid="listing-card"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-[#f1f2ee]">
        {listing.photoUrl ? (
          <Image
            src={listing.photoUrl}
            alt={listing.title}
            fill
            sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1.5">
            <Smartphone className="h-8 w-8 text-slate-400" aria-hidden />
            <span className="text-xs text-slate-600">No photos yet</span>
          </div>
        )}
        <span className="glass absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-ink">
          <ClipboardCheck className="h-3.5 w-3.5" aria-hidden />
          Inspection available
        </span>
      </div>
      <div className="flex flex-1 flex-col px-2.5 pb-2.5 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">{listing.brand}</p>
        <h3 className="mt-0.5 line-clamp-2 text-[15px] font-semibold leading-snug text-ink">{listing.title}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge>{CONDITION_LABEL[listing.condition]}</Badge>
          <Badge tone={PTA_TONE[listing.ptaStatus]}>{PTA_LABEL[listing.ptaStatus]}</Badge>
        </div>
        <div className="mt-auto pt-3">
          <p className="font-display text-xl font-extrabold tracking-tight tabular-nums">{formatPKR(listing.pricePkr)}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-600">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {listing.locationArea}, {listing.locationCity} · {timeAgo(listing.listedAt)}
          </p>
        </div>
      </div>
    </Link>
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
