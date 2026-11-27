import Image from 'next/image';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { Eye, MessageSquare, Plus, Smartphone } from 'lucide-react';
import prisma from '@/lib/prisma';
import { requirePageAuth } from '@/lib/ssr-auth';
import { DashboardLayout } from '@/components/layout/Layouts';
import { Card } from '@/components/ui/Card';
import { Badge, EmptyState } from '@/components/ui/Feedback';
import { LinkButton } from '@/components/ui/Button';
import { fileUrl, formatDate, formatPKR } from '@/lib/format';

type Row = { id: string; title: string; status: string; pricePkr: number; listedAt: string; viewCount: number; openInquiries: number; photoUrl: string | null };

const STATUS_TONE: Record<string, 'success' | 'neutral' | 'warning'> = { ACTIVE: 'success', SOLD: 'neutral', REMOVED: 'warning', DRAFT: 'neutral' };

export const getServerSideProps: GetServerSideProps = (ctx) =>
  requirePageAuth(ctx, ['CUSTOMER', 'SELLER', 'SHOP_OWNER'], async (user) => {
    const listings = await prisma.phoneListing.findMany({
      where: { userId: user.id },
      orderBy: { listedAt: 'desc' },
      include: {
        photos: { orderBy: [{ isPrimary: 'desc' }, { uploadSequence: 'asc' }], take: 1, select: { storageKey: true } },
        _count: { select: { inquiries: { where: { status: 'OPEN' } } } },
      },
    });
    return {
      listings: listings.map<Row>((l) => ({
        id: l.id,
        title: l.title,
        status: l.status,
        pricePkr: Number(l.pricePkr),
        listedAt: l.listedAt.toISOString(),
        viewCount: l.viewCount,
        openInquiries: l._count.inquiries,
        photoUrl: fileUrl(l.photos[0]?.storageKey),
      })),
    };
  });

export default function MyListings({ listings }: { listings: Row[] }) {
  return (
    <DashboardLayout title="My listings" description="Phones you are selling on MobCheck." actions={<LinkButton href="/listings/new"><Plus className="h-4 w-4" aria-hidden />New listing</LinkButton>}>
      {listings.length === 0 ? (
        <EmptyState icon={Smartphone} title="You haven't listed a phone yet" description="It takes about three minutes. Add photos and honest details, and buyers can book an inspection before paying." action={<LinkButton href="/listings/new">Sell a phone</LinkButton>} />
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100">
            {listings.map((l) => (
              <li key={l.id}>
                <Link href={`/dashboard/listings/${l.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 sm:px-5">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {l.photoUrl ? <Image src={l.photoUrl} alt="" fill sizes="56px" className="object-cover" /> : <Smartphone className="m-auto mt-4 h-6 w-6 text-slate-400" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{l.title}</p>
                    <p className="text-sm text-slate-500">{formatPKR(l.pricePkr)} · listed {formatDate(l.listedAt)}</p>
                    <p className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" aria-hidden />{l.viewCount} views</span>
                      <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" aria-hidden />{l.openInquiries} new messages</span>
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[l.status]}>{l.status.charAt(0) + l.status.slice(1).toLowerCase()}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </DashboardLayout>
  );
}
