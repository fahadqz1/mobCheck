import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { CalendarCheck, ClipboardCheck, MessageSquareWarning, Plus, ShieldCheck, Smartphone, Star, Store, Users, Wallet } from 'lucide-react';
import prisma from '@/lib/prisma';
import { requirePageAuth } from '@/lib/ssr-auth';
import { DashboardLayout } from '@/components/layout/Layouts';
import { Card, CardBody, CardHeader, StatCard } from '@/components/ui/Card';
import { Alert, Badge, EmptyState } from '@/components/ui/Feedback';
import { LinkButton } from '@/components/ui/Button';
import { BookingRow, BookingSummary } from '@/components/bookings/BookingRow';
import { formatPKR, SHOP_STATUS } from '@/lib/format';
import { bookingListInclude } from '@/lib/queries';

type Props = {
  role: string;
  firstName: string;
  data: any;
};

const OPEN_STATUSES = ['AWAITING_PAYMENT', 'PAYMENT_CONFIRMED', 'AWAITING_SHOP_CONFIRMATION', 'BOOKING_ACCEPTED', 'INSPECTOR_ASSIGNED', 'INSPECTION_IN_PROGRESS', 'INSPECTION_SUBMITTED', 'REPORT_DELIVERED', 'DISPUTE_RAISED'] as const;

export const getServerSideProps: GetServerSideProps = (ctx) =>
  requirePageAuth(ctx, undefined, async (user) => {
    let data: any = {};
    if (user.role === 'SUPER_ADMIN' || user.role === 'OPS_ADMIN') {
      const [customers, shops, pendingShops, listings, bookings, disputes, complaints, revenue] = await Promise.all([
        prisma.user.count({ where: { role: 'CUSTOMER' } }),
        prisma.shop.count({ where: { status: 'VERIFIED' } }),
        prisma.shop.count({ where: { status: 'PENDING' } }),
        prisma.phoneListing.count({ where: { status: 'ACTIVE' } }),
        prisma.inspectionBooking.count(),
        prisma.inspectionBooking.count({ where: { status: 'DISPUTE_RAISED' } }),
        prisma.complaint.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
        prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amountPkr: true } }),
      ]);
      const recent = await prisma.inspectionBooking.findMany({ include: bookingListInclude, orderBy: { createdAt: 'desc' }, take: 6 });
      data = { customers, shops, pendingShops, listings, bookings, disputes, complaints, revenue: revenue._sum.amountPkr ?? 0, recent };
    } else if (user.role === 'SHOP_OWNER') {
      const shop = await prisma.shop.findFirst({ where: { ownerId: user.id }, include: { subscriptions: true, _count: { select: { services: true, inspectors: true } } } });
      if (shop) {
        const [actionNeeded, active, completed, recent] = await Promise.all([
          prisma.inspectionBooking.count({ where: { shopId: shop.id, status: { in: ['PAYMENT_CONFIRMED', 'AWAITING_SHOP_CONFIRMATION', 'BOOKING_ACCEPTED'] } } }),
          prisma.inspectionBooking.count({ where: { shopId: shop.id, status: { in: ['INSPECTOR_ASSIGNED', 'INSPECTION_IN_PROGRESS', 'INSPECTION_SUBMITTED'] } } }),
          prisma.inspectionBooking.count({ where: { shopId: shop.id, status: 'COMPLETED' } }),
          prisma.inspectionBooking.findMany({ where: { shopId: shop.id, status: { not: 'AWAITING_PAYMENT' } }, include: bookingListInclude, orderBy: { createdAt: 'desc' }, take: 6 }),
        ]);
        data = { shop, actionNeeded, active, completed, recent };
      } else {
        data = { shop: null };
      }
    } else if (user.role === 'INSPECTOR') {
      const inspector = await prisma.inspector.findUnique({ where: { userId: user.id }, include: { shop: { select: { name: true, slug: true } } } });
      const where = { inspectorId: inspector?.id ?? '__none__' };
      const [assigned, inProgress, done, upcoming] = await Promise.all([
        prisma.inspectionBooking.count({ where: { ...where, status: 'INSPECTOR_ASSIGNED' } }),
        prisma.inspectionBooking.count({ where: { ...where, status: 'INSPECTION_IN_PROGRESS' } }),
        prisma.inspectionBooking.count({ where: { ...where, status: { in: ['INSPECTION_SUBMITTED', 'REPORT_DELIVERED', 'COMPLETED'] } } }),
        prisma.inspectionBooking.findMany({ where: { ...where, status: { in: ['INSPECTOR_ASSIGNED', 'INSPECTION_IN_PROGRESS'] } }, include: bookingListInclude, orderBy: { inspectionDate: 'asc' }, take: 6 }),
      ]);
      data = { inspector, assigned, inProgress, done, upcoming };
    } else {
      const [open, completed, listings, inquiries, recent] = await Promise.all([
        prisma.inspectionBooking.count({ where: { customerId: user.id, status: { in: [...OPEN_STATUSES] } } }),
        prisma.inspectionBooking.count({ where: { customerId: user.id, status: 'COMPLETED' } }),
        prisma.phoneListing.count({ where: { userId: user.id, status: 'ACTIVE' } }),
        prisma.listingInquiry.count({ where: { listing: { userId: user.id }, status: 'OPEN' } }),
        prisma.inspectionBooking.findMany({ where: { customerId: user.id }, include: bookingListInclude, orderBy: { createdAt: 'desc' }, take: 5 }),
      ]);
      data = { open, completed, listings, inquiries, recent };
    }
    return { role: user.role, firstName: user.firstName || '', data };
  });

export default function Dashboard({ role, firstName, data }: Props) {
  const router = useRouter();
  const denied = router.query.denied;
  const greeting = `Welcome back${firstName ? `, ${firstName}` : ''}`;

  return (
    <DashboardLayout title={greeting} description={descriptionFor(role)} actions={actionsFor(role, data)}>
      {denied && <Alert tone="warning" title="You don't have access to that page" className="mb-6">You were redirected to your dashboard.</Alert>}
      {role === 'SUPER_ADMIN' || role === 'OPS_ADMIN' ? (
        <AdminOverview d={data} />
      ) : role === 'SHOP_OWNER' ? (
        <VendorOverview d={data} />
      ) : role === 'INSPECTOR' ? (
        <InspectorOverview d={data} />
      ) : (
        <CustomerOverview d={data} />
      )}
    </DashboardLayout>
  );
}

const descriptionFor = (role: string) =>
  ({
    SHOP_OWNER: 'Manage your shop, bookings and inspectors.',
    INSPECTOR: 'Your assigned inspections and their progress.',
    SUPER_ADMIN: 'Platform health and items that need review.',
    OPS_ADMIN: 'Platform health and items that need review.',
  } as Record<string, string>)[role] || 'Track your inspections and phone listings.';

function actionsFor(role: string, d: any) {
  if (role === 'CUSTOMER' || role === 'SELLER')
    return (
      <>
        <LinkButton href="/shops" variant="outline">Book an inspection</LinkButton>
        <LinkButton href="/listings/new"><Plus className="h-4 w-4" aria-hidden />Sell a phone</LinkButton>
      </>
    );
  if (role === 'SHOP_OWNER' && d.shop) return <LinkButton href={`/shops/${d.shop.slug}`} variant="outline">View public profile</LinkButton>;
  return null;
}

function RecentBookings({ title, bookings, viewAll, perspective }: { title: string; bookings: BookingSummary[]; viewAll: string; perspective: 'customer' | 'shop' | 'inspector' | 'admin' }) {
  return (
    <Card className="mt-6">
      <CardHeader title={title} action={<Link href={viewAll} className="link text-sm">View all</Link>} />
      {bookings.length === 0 ? (
        <CardBody>
          <EmptyState icon={CalendarCheck} title="No bookings yet" description="Bookings will appear here as soon as they are made." className="border-0 py-8" />
        </CardBody>
      ) : (
        <ul className="divide-y divide-slate-100">
          {bookings.map((b) => (
            <BookingRow key={b.id} booking={b} perspective={perspective} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function CustomerOverview({ d }: { d: any }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open inspections" value={d.open} icon={CalendarCheck} />
        <StatCard label="Completed" value={d.completed} icon={ClipboardCheck} />
        <StatCard label="Active listings" value={d.listings} icon={Smartphone} />
        <StatCard label="Buyer messages" value={d.inquiries} icon={Users} hint="Open inquiries on your listings" />
      </div>
      <RecentBookings title="Recent inspections" bookings={d.recent} viewAll="/dashboard/bookings" perspective="customer" />
    </>
  );
}

function VendorOverview({ d }: { d: any }) {
  if (!d.shop)
    return (
      <EmptyState
        icon={Store}
        title="Register your shop to start accepting inspections"
        description="Add your shop details. Our team verifies new shops before they appear in the directory."
        action={<LinkButton href="/vendor/shop">Register shop</LinkButton>}
      />
    );
  const status = SHOP_STATUS[d.shop.status];
  const sub = d.shop.subscriptions?.[0];
  return (
    <>
      {d.shop.status !== 'VERIFIED' && (
        <Alert tone={d.shop.status === 'PENDING' ? 'info' : 'danger'} title={`Shop status: ${status.label}`} className="mb-6">
          {d.shop.status === 'PENDING'
            ? 'Your shop is hidden from customers until the MobCheck team verifies it. Complete your profile and services in the meantime.'
            : 'Your shop cannot receive bookings. Contact MobCheck support for details.'}
        </Alert>
      )}
      {d.shop._count.services === 0 && (
        <Alert tone="warning" title="Add your services and prices" className="mb-6">
          Customers see your inspection and repair prices before booking. <Link href="/vendor/services" className="font-medium underline">Add services</Link>
        </Alert>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Needs your action" value={d.actionNeeded} icon={CalendarCheck} hint="Accept bookings or assign inspectors" />
        <StatCard label="In progress" value={d.active} icon={ClipboardCheck} />
        <StatCard label="Completed" value={d.completed} icon={ShieldCheck} />
        <StatCard label="Rating" value={d.shop.averageRating ? `${Number(d.shop.averageRating).toFixed(1)} / 5` : '—'} icon={Star} hint={`${d.shop.totalReviews} verified reviews`} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <Badge tone={status.tone}>{status.label}</Badge>
        {sub && <Badge tone={sub.status === 'ACTIVE' || sub.status === 'TRIAL' ? 'brand' : 'danger'}>Subscription: {sub.status.toLowerCase()}</Badge>}
        <span>{d.shop._count.inspectors} inspector(s)</span>
      </div>
      <RecentBookings title="Latest bookings" bookings={d.recent} viewAll="/vendor/bookings" perspective="shop" />
    </>
  );
}

function InspectorOverview({ d }: { d: any }) {
  if (!d.inspector) return <Alert tone="warning" title="Your inspector profile is not linked to a shop yet">Ask your shop owner to add you as an inspector.</Alert>;
  return (
    <>
      <p className="mb-4 text-sm text-slate-600">Inspecting for <Link href={`/shops/${d.inspector.shop.slug}`} className="link">{d.inspector.shop.name}</Link></p>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Assigned to you" value={d.assigned} icon={CalendarCheck} />
        <StatCard label="In progress" value={d.inProgress} icon={ClipboardCheck} />
        <StatCard label="Submitted" value={d.done} icon={ShieldCheck} />
      </div>
      <RecentBookings title="Up next" bookings={d.upcoming} viewAll="/inspector" perspective="inspector" />
    </>
  );
}

function AdminOverview({ d }: { d: any }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Customers" value={d.customers} icon={Users} />
        <StatCard label="Verified shops" value={d.shops} icon={Store} />
        <StatCard label="Active listings" value={d.listings} icon={Smartphone} />
        <StatCard label="Paid revenue" value={formatPKR(d.revenue)} icon={Wallet} />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <ReviewQueue href="/admin/shops?status=PENDING" icon={ShieldCheck} label="Shops awaiting verification" count={d.pendingShops} />
        <ReviewQueue href="/admin/complaints" icon={MessageSquareWarning} label="Open complaints" count={d.complaints} />
        <ReviewQueue href="/admin/bookings?status=DISPUTE_RAISED" icon={CalendarCheck} label="Open disputes" count={d.disputes} />
      </div>
      <RecentBookings title={`Latest bookings (${d.bookings} total)`} bookings={d.recent} viewAll="/admin/bookings" perspective="admin" />
    </>
  );
}

function ReviewQueue({ href, icon: Icon, label, count }: { href: string; icon: any; label: string; count: number }) {
  return (
    <Link href={href} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-card transition hover:border-slate-300">
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-slate-400" />
        <span className={count > 0 ? 'rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800' : 'text-xs text-slate-400'}>{count > 0 ? `${count} to review` : 'All clear'}</span>
      </div>
      <p className="mt-3 text-sm font-medium group-hover:text-brand-800">{label}</p>
    </Link>
  );
}
