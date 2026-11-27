import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Smartphone } from 'lucide-react';
import { Badge } from '@/components/ui/Feedback';
import { CONDITION_LABEL, formatPKR, PTA_LABEL, PTA_TONE, timeAgo } from '@/lib/format';
import type { ListingCard as ListingCardData } from '@/lib/listing';

export function ListingCard({ listing }: { listing: ListingCardData }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card transition hover:border-slate-300 hover:shadow-raised"
      data-testid="listing-card"
    >
      <div className="relative aspect-[4/3] bg-slate-100">
        {listing.photoUrl ? (
          <Image src={listing.photoUrl} alt={listing.title} fill sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 100vw" className="object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 text-slate-400">
            <Smartphone className="h-8 w-8" aria-hidden />
            <span className="text-xs">No photos yet</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{listing.brand}</p>
        <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold text-ink group-hover:text-brand-800">{listing.title}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge>{CONDITION_LABEL[listing.condition]}</Badge>
          <Badge tone={PTA_TONE[listing.ptaStatus]}>{PTA_LABEL[listing.ptaStatus]}</Badge>
        </div>
        <div className="mt-auto pt-3">
          <p className="text-lg font-semibold tabular-nums">{formatPKR(listing.pricePkr)}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
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
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="aspect-[4/3] animate-pulse bg-slate-200/70" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-16 animate-pulse rounded bg-slate-200/70" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-200/70" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200/70" />
        <div className="h-6 w-24 animate-pulse rounded bg-slate-200/70" />
      </div>
    </div>
  );
}
