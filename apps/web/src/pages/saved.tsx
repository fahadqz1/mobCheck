import { useEffect, useState } from 'react';
import type { GetServerSideProps } from 'next';
import { Heart } from 'lucide-react';
import { getSsrUser } from '@/lib/ssr-auth';
import { serialize } from '@/lib/serialize';
import { SiteLayout, PageHeader } from '@/components/layout/Layouts';
import { ListingCard, ListingCardSkeleton } from '@/components/listings/ListingCard';
import { EmptyState } from '@/components/ui/Feedback';
import { LinkButton } from '@/components/ui/Button';
import { useSaved } from '@/hooks/useSaved';
import { api } from '@/lib/client';
import type { ListingCard as ListingCardData } from '@/lib/listing';

export const getServerSideProps: GetServerSideProps = async (ctx) => ({ props: serialize({ user: await getSsrUser(ctx) }) });

export default function Saved() {
  const { ids } = useSaved();
  const [items, setItems] = useState<ListingCardData[] | null>(null);

  useEffect(() => {
    if (ids.length === 0) {
      setItems([]);
      return;
    }
    api<{ data: ListingCardData[] }>(`/api/listings?ids=${ids.join(',')}`)
      .then((r) => setItems(ids.map((id) => r.data.find((l) => l.id === id)).filter(Boolean) as ListingCardData[]))
      .catch(() => setItems([]));
  }, [ids]);

  return (
    <SiteLayout title="Saved phones">
      <div className="page-container py-8">
        <PageHeader title="Saved phones" description="Tap the heart on any phone to keep it here. Saved on this device." />
        {items === null ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)}</div>
        ) : items.length === 0 ? (
          <EmptyState icon={Heart} title="No saved phones yet" description="Save phones you like to compare them later. Sold or removed phones disappear from this list." action={<LinkButton href="/marketplace">Browse phones</LinkButton>} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{items.map((l) => <ListingCard key={l.id} listing={l} />)}</div>
        )}
      </div>
    </SiteLayout>
  );
}
