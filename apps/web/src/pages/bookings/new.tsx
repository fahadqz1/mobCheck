import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { ClipboardCheck, MapPin, ShieldCheck } from 'lucide-react';
import prisma from '@/lib/prisma';
import { requirePageAuth } from '@/lib/ssr-auth';
import { loadBrandOptions } from '@/lib/brands';
import { getInspectionFee } from '@/lib/settings';
import { SiteLayout, PageHeader } from '@/components/layout/Layouts';
import { Card, CardBody } from '@/components/ui/Card';
import { Alert, EmptyState } from '@/components/ui/Feedback';
import { Button, LinkButton } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Form';
import type { BrandOption } from '@/components/listings/ListingForm';
import { api, ApiError } from '@/lib/client';
import { formatPKR } from '@/lib/format';

type ShopOption = { id: string; slug: string; name: string; area: string; city: string; openingHour: string | null; closingHour: string | null; weeklyHolidays: string[] };
type Props = {
  shops: ShopOption[];
  fixedShopId: string | null;
  brands: BrandOption[];
  fee: number;
  prefill: { brandId: string; modelId: string; storage: string; color: string; pta: string; listingTitle: string | null; city: string | null };
};

export const getServerSideProps: GetServerSideProps = (ctx) =>
  requirePageAuth(ctx, ['CUSTOMER', 'SELLER'], async () => {
    const listing = typeof ctx.query.listing === 'string' ? await prisma.phoneListing.findUnique({ where: { id: ctx.query.listing }, select: { title: true, brandId: true, modelId: true, storageGb: true, color: true, ptaStatus: true, locationCity: true, status: true } }) : null;
    const shopSlug = typeof ctx.query.shop === 'string' ? ctx.query.shop : null;
    const shops = await prisma.shop.findMany({
      where: { status: 'VERIFIED', inspectors: { some: { status: 'ACTIVE' } }, ...(shopSlug ? { slug: shopSlug } : {}) },
      select: { id: true, slug: true, name: true, area: true, city: true, openingHour: true, closingHour: true, weeklyHolidays: true },
      orderBy: { name: 'asc' },
    });
    const sorted = listing ? [...shops].sort((a, b) => Number(b.city === listing.locationCity) - Number(a.city === listing.locationCity)) : shops;
    return {
      shops: sorted,
      fixedShopId: shopSlug && shops[0] ? shops[0].id : null,
      brands: await loadBrandOptions(),
      fee: await getInspectionFee(),
      prefill: {
        brandId: listing?.brandId || '',
        modelId: listing?.modelId || '',
        storage: listing?.storageGb?.toString() || '',
        color: listing?.color || '',
        pta: listing && ['APPROVED', 'NON_PTA'].includes(listing.ptaStatus) ? listing.ptaStatus : 'UNKNOWN',
        listingTitle: listing?.title || null,
        city: listing?.locationCity || null,
      },
    };
  });

const pad = (n: number) => String(n).padStart(2, '0');
const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function timeSlots(open: string | null, close: string | null) {
  const [oh, om] = (open || '10:00').split(':').map(Number);
  const [ch, cm] = (close || '20:00').split(':').map(Number);
  const slots: string[] = [];
  for (let m = oh * 60 + om; m + 30 <= ch * 60 + cm; m += 30) slots.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
  return slots;
}

export default function NewBooking({ shops, fixedShopId, brands, fee, prefill }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    shopId: fixedShopId || '',
    brandId: prefill.brandId,
    modelId: prefill.modelId,
    deviceStorageGb: prefill.storage,
    deviceColor: prefill.color,
    ptaStatus: prefill.pta,
    date: '',
    time: '',
  });
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const shop = shops.find((s) => s.id === form.shopId);
  const models = brands.find((b) => b.id === form.brandId)?.models || [];
  const slots = useMemo(() => timeSlots(shop?.openingHour ?? null, shop?.closingHour ?? null), [shop]);
  const today = new Date();
  const maxDate = new Date(Date.now() + 30 * 86400000);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFields({});
    setError('');
    try {
      const { data } = await api<{ data: { id: string } }>('/api/bookings', { body: { ...form, deviceStorageGb: form.deviceStorageGb || undefined, deviceColor: form.deviceColor || undefined } });
      router.push(`/dashboard/bookings/${data.id}?created=1`);
    } catch (err) {
      setFields((err as ApiError).fields || {});
      setError((err as ApiError).message);
      setSaving(false);
    }
  };

  if (shops.length === 0) {
    return (
      <SiteLayout title="Book an inspection">
        <div className="page-container max-w-2xl py-12">
          <EmptyState icon={ClipboardCheck} title="No shop is taking bookings right now" description="Shops need at least one active inspector before they can accept bookings. Please check back soon." action={<LinkButton href="/shops" variant="outline">Browse shops</LinkButton>} />
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout title="Book an inspection">
      <div className="page-container grid max-w-5xl gap-8 py-8 lg:grid-cols-[1fr_320px]">
        <div>
          <PageHeader title="Book an inspection" description={prefill.listingTitle ? <>For the listing <span className="font-medium text-ink">{prefill.listingTitle}</span></> : 'Have a phone checked by a verified shop before you pay for it.'} />
          {error && <Alert tone="danger" title={error} className="mb-6" />}
          <form onSubmit={submit} noValidate>
            <Card>
              <CardBody className="space-y-6 py-6">
                <section className="space-y-4">
                  <h2 className="text-base font-semibold">Shop</h2>
                  {fixedShopId && shop ? (
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm">
                      <span><span className="font-medium">{shop.name}</span><span className="text-slate-500"> · {shop.area}, {shop.city}</span></span>
                      <Link href="/bookings/new" className="link">Change</Link>
                    </div>
                  ) : (
                    <Field label="Inspection shop" error={fields.shopId} required>
                      {(p) => (
                        <Select {...p} value={form.shopId} onChange={(e) => setForm((f) => ({ ...f, shopId: e.target.value, time: '' }))}>
                          <option value="">Choose a shop</option>
                          {shops.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.area}, {s.city}</option>)}
                        </Select>
                      )}
                    </Field>
                  )}
                </section>

                <section className="space-y-4">
                  <h2 className="text-base font-semibold">Phone to inspect</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Brand" error={fields.brandId} required>
                      {(p) => (
                        <Select {...p} value={form.brandId} onChange={(e) => setForm((f) => ({ ...f, brandId: e.target.value, modelId: '' }))}>
                          <option value="">Choose brand</option>
                          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </Select>
                      )}
                    </Field>
                    <Field label="Model" error={fields.modelId} required>
                      {(p) => (
                        <Select {...p} value={form.modelId} onChange={set('modelId')} disabled={!form.brandId}>
                          <option value="">{form.brandId ? 'Choose model' : 'Choose a brand first'}</option>
                          {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </Select>
                      )}
                    </Field>
                    <Field label="Storage (GB)" error={fields.deviceStorageGb}>{(p) => <Input {...p} inputMode="numeric" value={form.deviceStorageGb} onChange={(e) => setForm((f) => ({ ...f, deviceStorageGb: e.target.value.replace(/\D/g, '') }))} />}</Field>
                    <Field label="Colour" error={fields.deviceColor}>{(p) => <Input {...p} value={form.deviceColor} onChange={set('deviceColor')} />}</Field>
                    <Field label="PTA status (as claimed)" error={fields.ptaStatus}>
                      {(p) => (
                        <Select {...p} value={form.ptaStatus} onChange={set('ptaStatus')}>
                          <option value="UNKNOWN">Not sure</option>
                          <option value="APPROVED">PTA approved</option>
                          <option value="NON_PTA">Non-PTA</option>
                        </Select>
                      )}
                    </Field>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-base font-semibold">Date & time</h2>
                  {shop && <p className="text-sm text-slate-600">Open {shop.openingHour}–{shop.closingHour}{shop.weeklyHolidays.length ? `, closed ${shop.weeklyHolidays.join(', ')}` : ''}.</p>}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Date" error={fields.date} required>{(p) => <Input {...p} type="date" min={toDateInput(today)} max={toDateInput(maxDate)} value={form.date} onChange={set('date')} />}</Field>
                    <Field label="Time" error={fields.time} required>
                      {(p) => (
                        <Select {...p} value={form.time} onChange={set('time')} disabled={!shop}>
                          <option value="">{shop ? 'Choose time' : 'Choose a shop first'}</option>
                          {slots.map((t) => <option key={t} value={t}>{t}</option>)}
                        </Select>
                      )}
                    </Field>
                  </div>
                </section>
              </CardBody>
            </Card>
            <div className="mt-6 flex justify-end gap-3">
              <LinkButton href="/shops" variant="ghost">Cancel</LinkButton>
              <Button type="submit" size="lg" loading={saving}>Continue to payment</Button>
            </div>
          </form>
        </div>

        <aside className="space-y-4 lg:pt-16">
          <Card className="p-5">
            <p className="text-sm text-slate-600">Inspection fee</p>
            <p className="text-2xl font-semibold">{formatPKR(fee)}</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li className="flex gap-2"><ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden />Full checklist with photo evidence</li>
              <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden />Report with a public verification number</li>
              <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden />Full refund if the shop declines</li>
            </ul>
          </Card>
          <p className="text-xs text-slate-500">The shop only sees your contact details after you pay.</p>
        </aside>
      </div>
    </SiteLayout>
  );
}
