import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, Clock, MapPin } from 'lucide-react';
import { Rating } from '@/components/ui/Rating';
import { initials } from '@/components/ui/Avatar';

export type ShopCardData = {
  id: string;
  slug: string;
  name: string;
  city: string;
  area: string;
  logoUrl: string | null;
  coverUrl: string | null;
  averageRating: number | null;
  totalReviews: number;
  openingHour: string | null;
  closingHour: string | null;
  servicesCount: number;
  completedInspections: number;
};

export function ShopLogo({ name, url, className = 'h-14 w-14 text-lg' }: { name: string; url: string | null; className?: string }) {
  return (
    <span className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border-[3px] border-white bg-ink font-display font-extrabold text-lime-300 shadow-raised ${className}`}>
      {url ? <Image src={url} alt={`${name} logo`} fill sizes="96px" className="object-cover" /> : initials(name)}
    </span>
  );
}

const TILES = ['bg-tile-mint', 'bg-tile-lilac', 'bg-tile-peach', 'bg-tile-sky', 'bg-tile-butter', 'bg-tile-rose'];
const tileFor = (name: string) => TILES[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % TILES.length];

export function ShopCover({ url, name, className = 'h-28' }: { url: string | null; name: string; className?: string }) {
  return (
    <div className={`relative w-full overflow-hidden ${url ? 'bg-slate-200' : tileFor(name)} ${className}`}>
      {url && <Image src={url} alt={`${name} storefront`} fill sizes="(min-width: 1024px) 1200px, 100vw" className="object-cover" />}
    </div>
  );
}

export function ShopCard({ shop }: { shop: ShopCardData }) {
  return (
    <Link href={`/shops/${shop.slug}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-raised" data-testid="shop-card">
      <ShopCover url={shop.coverUrl} name={shop.name} />
      <div className="flex flex-1 flex-col px-4 pb-4">
        <div className="relative z-10 -mt-7 flex items-end gap-3">
          <ShopLogo name={shop.name} url={shop.logoUrl} />
        </div>
        <h3 className="mt-3 flex items-center gap-1.5 font-semibold">
          {shop.name}
          <BadgeCheck className="h-4 w-4 text-brand-700" aria-label="Verified by MobCheck" />
        </h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-slate-600"><MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden />{shop.area}, {shop.city}</p>
        {shop.openingHour && shop.closingHour && (
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-600"><Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden />{shop.openingHour} – {shop.closingHour}</p>
        )}
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 mt-4">
          <Rating value={shop.averageRating} count={shop.totalReviews} />
          <span className="text-xs text-slate-600">{shop.completedInspections} inspections</span>
        </div>
      </div>
    </Link>
  );
}
