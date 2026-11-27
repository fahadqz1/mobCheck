import { useState } from 'react';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { ExternalLink } from 'lucide-react';
import prisma from '@/lib/prisma';
import { requirePageAuth } from '@/lib/ssr-auth';
import { DashboardLayout } from '@/components/layout/Layouts';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Alert, Badge } from '@/components/ui/Feedback';
import { Button, LinkButton } from '@/components/ui/Button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { ImageSlot } from '@/components/shops/ImageSlot';
import { PhotoPicker, PickedPhoto } from '@/components/listings/PhotoPicker';
import { api, ApiError } from '@/lib/client';
import { CITIES, fileUrl, SHOP_STATUS } from '@/lib/format';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type Form = {
  name: string;
  description: string;
  email: string;
  phone: string;
  whatsapp: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  area: string;
  openingHour: string;
  closingHour: string;
  weeklyHolidays: string[];
  latitude: string;
  longitude: string;
};

type Props = {
  shop: null | { id: string; slug: string; status: string; form: Form; logoUrl: string | null; coverUrl: string | null; gallery: { key: string; url: string }[] };
  defaults: Pick<Form, 'email' | 'phone'>;
};

export const getServerSideProps: GetServerSideProps = (ctx) =>
  requirePageAuth(ctx, ['SHOP_OWNER'], async (user) => {
    const s = await prisma.shop.findFirst({ where: { ownerId: user.id } });
    return {
      defaults: { email: user.email, phone: user.phone || '' },
      shop: s && {
        id: s.id,
        slug: s.slug,
        status: s.status,
        logoUrl: fileUrl(s.logoUrl),
        coverUrl: fileUrl(s.coverUrl),
        gallery: s.galleryUrls.map((key) => ({ key, url: fileUrl(key)! })),
        form: {
          name: s.name,
          description: s.description || '',
          email: s.email,
          phone: s.phone,
          whatsapp: s.whatsapp || '',
          addressLine1: s.addressLine1,
          addressLine2: s.addressLine2 || '',
          city: s.city,
          area: s.area,
          openingHour: s.openingHour || '10:00',
          closingHour: s.closingHour || '21:00',
          weeklyHolidays: s.weeklyHolidays,
          latitude: s.latitude?.toString() || '',
          longitude: s.longitude?.toString() || '',
        },
      },
    };
  });

export default function VendorShop({ shop, defaults }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<Form>(
    shop?.form || { name: '', description: '', email: defaults.email, phone: defaults.phone, whatsapp: '', addressLine1: '', addressLine2: '', city: '', area: '', openingHour: '10:00', closingHour: '21:00', weeklyHolidays: [], latitude: '', longitude: '' }
  );
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [logo, setLogo] = useState(shop?.logoUrl ?? null);
  const [cover, setCover] = useState(shop?.coverUrl ?? null);
  const [gallery, setGallery] = useState<PickedPhoto[]>(shop?.gallery.map((g) => ({ id: g.key, url: g.url })) ?? []);
  const [imageError, setImageError] = useState('');

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFields({});
    setError('');
    try {
      const body = { ...form, description: form.description || undefined, addressLine2: form.addressLine2 || undefined };
      await api('/api/vendor/shop', { method: shop ? 'PATCH' : 'POST', body });
      toast('success', shop ? 'Shop profile saved' : 'Shop registered. Our team will verify it shortly.');
      router.replace(shop ? router.asPath : '/vendor/shop', undefined, { scroll: !shop });
    } catch (err) {
      setFields((err as ApiError).fields || {});
      setError((err as ApiError).message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (kind: 'logo' | 'cover' | 'gallery', file: File) => {
    setImageError('');
    const fd = new FormData();
    fd.append('kind', kind);
    fd.append('file', file);
    try {
      const { data } = await api<{ data: { key: string; url: string } }>('/api/vendor/shop/images', { formData: fd });
      if (kind === 'logo') setLogo(data.url);
      else if (kind === 'cover') setCover(data.url);
      else setGallery((g) => [...g, { id: data.key, url: data.url }]);
    } catch (err) {
      setImageError((err as ApiError).message);
    }
  };

  const removeImage = async (kind: 'logo' | 'cover' | 'gallery', key?: string) => {
    setImageError('');
    try {
      await api('/api/vendor/shop/images', { method: 'DELETE', body: { kind, key } });
      if (kind === 'logo') setLogo(null);
      else if (kind === 'cover') setCover(null);
      else setGallery((g) => g.filter((x) => x.id !== key));
    } catch (err) {
      setImageError((err as ApiError).message);
    }
  };

  const status = shop ? SHOP_STATUS[shop.status] : null;

  return (
    <DashboardLayout
      title={shop ? 'Shop profile' : 'Register your shop'}
      description={shop ? <span className="inline-flex items-center gap-2">Status: <Badge tone={status!.tone}>{status!.label}</Badge></span> : 'Tell customers where you are and when you are open. MobCheck verifies every new shop.'}
      actions={shop ? <LinkButton href={`/shops/${shop.slug}`} variant="outline"><ExternalLink className="h-4 w-4" aria-hidden />View public page</LinkButton> : undefined}
    >
      {error && <Alert tone="danger" title={error} className="mb-6" />}
      {shop?.status === 'PENDING' && <Alert tone="info" title="Verification in progress" className="mb-6">Your shop will appear in the directory once our team approves it, usually within two working days.</Alert>}

      {shop && (
        <Card as="section" className="mb-6">
          <CardHeader title="Branding" description="A clear logo and storefront photo help customers find you." />
          <CardBody className="space-y-6">
            {imageError && <Alert tone="danger" title={imageError} />}
            <div className="grid gap-6 sm:grid-cols-[160px_1fr]">
              <ImageSlot label="Logo" url={logo} className="aspect-square w-40" onUpload={(f) => uploadImage('logo', f)} onRemove={() => removeImage('logo')} />
              <ImageSlot label="Cover photo" url={cover} className="aspect-[3/1] w-full" onUpload={(f) => uploadImage('cover', f)} onRemove={() => removeImage('cover')} />
            </div>
            <div>
              <p className="text-label mb-1.5">Gallery</p>
              <PhotoPicker photos={gallery} max={8} onAdd={async (files) => { for (const f of files) await uploadImage('gallery', f); }} onRemove={(key) => removeImage('gallery', key)} />
            </div>
          </CardBody>
        </Card>
      )}

      <form onSubmit={save} noValidate>
        <Card as="section">
          <CardHeader title="Shop details" />
          <CardBody className="space-y-5">
            <Field label="Shop name" error={fields.name} required>{(p) => <Input {...p} value={form.name} onChange={set('name')} />}</Field>
            <Field label="Description" error={fields.description} hint="What you specialise in, brands you repair, years in business.">{(p) => <Textarea {...p} rows={4} value={form.description} onChange={set('description')} maxLength={1500} />}</Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Phone" error={fields.phone} required>{(p) => <Input {...p} type="tel" value={form.phone} onChange={set('phone')} placeholder="0300 1234567" />}</Field>
              <Field label="WhatsApp" error={fields.whatsapp} hint="Defaults to phone">{(p) => <Input {...p} type="tel" value={form.whatsapp} onChange={set('whatsapp')} />}</Field>
              <Field label="Email" error={fields.email} required>{(p) => <Input {...p} type="email" value={form.email} onChange={set('email')} />}</Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Address" error={fields.addressLine1} required>{(p) => <Input {...p} value={form.addressLine1} onChange={set('addressLine1')} placeholder="Shop 14, Ground floor" />}</Field>
              <Field label="Address line 2" error={fields.addressLine2}>{(p) => <Input {...p} value={form.addressLine2} onChange={set('addressLine2')} placeholder="Building or plaza" />}</Field>
              <Field label="City" error={fields.city} required>
                {(p) => (
                  <Select {...p} value={form.city} onChange={set('city')}>
                    <option value="">Choose city</option>
                    {CITIES.map((c) => <option key={c}>{c}</option>)}
                  </Select>
                )}
              </Field>
              <Field label="Market / area" error={fields.area} required>{(p) => <Input {...p} value={form.area} onChange={set('area')} placeholder="Hafeez Centre" />}</Field>
              <Field label="Latitude" error={fields.latitude} hint="Optional, for the map link">{(p) => <Input {...p} inputMode="decimal" value={form.latitude} onChange={set('latitude')} placeholder="31.5204" />}</Field>
              <Field label="Longitude" error={fields.longitude}>{(p) => <Input {...p} inputMode="decimal" value={form.longitude} onChange={set('longitude')} placeholder="74.3587" />}</Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Opens at" error={fields.openingHour} required>{(p) => <Input {...p} type="time" value={form.openingHour} onChange={set('openingHour')} />}</Field>
              <Field label="Closes at" error={fields.closingHour} required>{(p) => <Input {...p} type="time" value={form.closingHour} onChange={set('closingHour')} />}</Field>
            </div>
            <fieldset>
              <legend className="text-label mb-2">Weekly holidays</legend>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {DAYS.map((d) => (
                  <Checkbox
                    key={d}
                    label={d}
                    checked={form.weeklyHolidays.includes(d)}
                    onChange={(e) => setForm((f) => ({ ...f, weeklyHolidays: e.target.checked ? [...f.weeklyHolidays, d] : f.weeklyHolidays.filter((x) => x !== d) }))}
                  />
                ))}
              </div>
            </fieldset>
            <div className="flex justify-end">
              <Button type="submit" loading={saving}>{shop ? 'Save changes' : 'Register shop'}</Button>
            </div>
          </CardBody>
        </Card>
      </form>
    </DashboardLayout>
  );
}
