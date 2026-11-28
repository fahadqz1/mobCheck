import { useState } from 'react';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { ExternalLink, MessagesSquare } from 'lucide-react';
import prisma from '@/lib/prisma';
import { requirePageAuth } from '@/lib/ssr-auth';
import { loadBrandOptions } from '@/lib/brands';
import { DashboardLayout } from '@/components/layout/Layouts';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Alert, Badge, EmptyState } from '@/components/ui/Feedback';
import { Button, LinkButton } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { BrandOption, ListingFields, ListingFormValues, toPayload } from '@/components/listings/ListingForm';
import { PhotoPicker, PickedPhoto } from '@/components/listings/PhotoPicker';
import { api, ApiError } from '@/lib/client';
import { fileUrl, formatDate, fullName, listingRef } from '@/lib/format';
import type { ClientUser } from '@/context/AuthContext';

type Inquiry = { id: string; message: string | null; createdAt: string; customer: { firstName: string | null; lastName: string | null } };
type Props = {
  user: ClientUser;
  brands: BrandOption[];
  listing: { id: string; status: string; title: string; viewCount: number; values: ListingFormValues; photos: PickedPhoto[]; inquiries: Inquiry[] };
};

export const getServerSideProps: GetServerSideProps = (ctx) =>
  requirePageAuth(ctx, ['CUSTOMER', 'SELLER', 'SHOP_OWNER'], async (user) => {
    const l = await prisma.phoneListing.findUnique({
      where: { id: String(ctx.params?.id) },
      include: {
        photos: { orderBy: { uploadSequence: 'asc' } },
        inquiries: { orderBy: { createdAt: 'desc' }, include: { customer: { select: { firstName: true, lastName: true } } } },
      },
    });
    if (!l || l.userId !== user.id) return { notFound: true };
    const values: ListingFormValues = {
      brandId: l.brandId,
      modelId: l.modelId,
      storageGb: l.storageGb?.toString() || '',
      ramGb: l.ramGb?.toString() || '',
      color: l.color || '',
      condition: l.condition,
      pricePkr: Number(l.pricePkr).toString(),
      ptaStatus: ['APPROVED', 'NON_PTA'].includes(l.ptaStatus) ? l.ptaStatus : 'UNKNOWN',
      batteryHealth: l.batteryHealth?.toString() || '',
      repairHistory: l.repairHistory || '',
      hasBox: l.hasBox,
      hasCharger: l.hasCharger,
      hasAccessories: l.hasAccessories.join(', '),
      title: l.title,
      description: l.description || '',
      locationCity: l.locationCity,
      locationArea: l.locationArea,
      sellerContactPreference: l.sellerContactPreference === 'WHATSAPP' ? 'WHATSAPP' : 'PLATFORM',
    };
    return {
      brands: await loadBrandOptions(),
      listing: {
        id: l.id,
        status: l.status,
        title: l.title,
        viewCount: l.viewCount,
        values,
        photos: l.photos.map((p) => ({ id: p.id, url: fileUrl(p.storageKey)!, isPrimary: p.isPrimary })),
        inquiries: l.inquiries.map((i) => ({ id: i.id, message: i.message, createdAt: i.createdAt.toISOString(), customer: i.customer })),
      },
    };
  });

export default function ManageListing({ brands, listing }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState(listing.values);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<PickedPhoto[]>(listing.photos);
  const [photoError, setPhotoError] = useState(typeof router.query.photoError === 'string' ? router.query.photoError : '');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<null | 'SOLD' | 'REMOVED' | 'ACTIVE'>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await api(`/api/listings/${listing.id}`, { method: 'PATCH', body: toPayload(values) });
      toast('success', 'Listing updated');
      router.replace(router.asPath, undefined, { scroll: false });
    } catch (err) {
      setErrors((err as ApiError).fields || {});
      toast('error', (err as ApiError).message);
    } finally {
      setSaving(false);
    }
  };

  const upload = async (files: File[]) => {
    setPhotoError('');
    for (const file of files) {
      const tempId = `tmp-${Math.random()}`;
      setPhotos((p) => [...p, { id: tempId, url: URL.createObjectURL(file), uploading: true }]);
      try {
        const form = new FormData();
        form.append('file', file);
        const { data } = await api<{ data: { id: string; url: string; isPrimary: boolean } }>(`/api/listings/${listing.id}/photos`, { formData: form });
        setPhotos((p) => p.map((x) => (x.id === tempId ? { id: data.id, url: data.url, isPrimary: data.isPrimary } : x)));
      } catch (err) {
        setPhotos((p) => p.filter((x) => x.id !== tempId));
        setPhotoError((err as ApiError).message);
      }
    }
  };

  const remove = async (id: string) => {
    try {
      await api(`/api/listings/${listing.id}/photos/${id}`, { method: 'DELETE' });
      setPhotos((p) => {
        const rest = p.filter((x) => x.id !== id);
        if (p.find((x) => x.id === id)?.isPrimary && rest[0]) rest[0] = { ...rest[0], isPrimary: true };
        return rest;
      });
    } catch (err) {
      setPhotoError((err as ApiError).message);
    }
  };

  const makePrimary = async (id: string) => {
    try {
      await api(`/api/listings/${listing.id}/photos/${id}`, { method: 'PATCH' });
      setPhotos((p) => p.map((x) => ({ ...x, isPrimary: x.id === id })));
    } catch (err) {
      setPhotoError((err as ApiError).message);
    }
  };

  const changeStatus = async () => {
    if (!confirm) return;
    setStatusSaving(true);
    try {
      await api(`/api/listings/${listing.id}`, { method: 'PATCH', body: { status: confirm } });
      toast('success', confirm === 'SOLD' ? 'Marked as sold' : confirm === 'REMOVED' ? 'Listing taken down' : 'Listing is live again');
      setConfirm(null);
      router.replace(router.asPath, undefined, { scroll: false });
    } catch (err) {
      toast('error', (err as ApiError).message);
    } finally {
      setStatusSaving(false);
    }
  };

  return (
    <DashboardLayout
      title={listing.title}
      description={<>Ref {listingRef(listing.id)} · {listing.viewCount} views · <Badge tone={listing.status === 'ACTIVE' ? 'success' : 'neutral'}>{listing.status.toLowerCase()}</Badge></>}
      actions={
        <>
          <LinkButton href={`/listings/${listing.id}`} variant="outline"><ExternalLink className="h-4 w-4" aria-hidden />View listing</LinkButton>
          {listing.status === 'ACTIVE' ? (
            <>
              <Button variant="outline" onClick={() => setConfirm('SOLD')}>Mark as sold</Button>
              <Button variant="ghost" onClick={() => setConfirm('REMOVED')}>Take down</Button>
            </>
          ) : (
            <Button onClick={() => setConfirm('ACTIVE')}>Relist</Button>
          )}
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card as="section">
            <CardHeader title="Photos" description="The cover photo is shown in search results." />
            <CardBody>
              <PhotoPicker photos={photos} onAdd={upload} onRemove={remove} onMakePrimary={makePrimary} error={photoError} />
            </CardBody>
          </Card>
          <form onSubmit={save} noValidate>
            <Card as="section">
              <CardHeader title="Details" />
              <CardBody>
                <ListingFields values={values} onChange={setValues} errors={errors} brands={brands} />
                <div className="mt-6 flex justify-end">
                  <Button type="submit" loading={saving}>Save changes</Button>
                </div>
              </CardBody>
            </Card>
          </form>
        </div>

        <Card as="section" className="self-start">
          <CardHeader title="Buyer messages" description="Buyers now message you in Messages. Older enquiries are shown below." action={<LinkButton href="/messages" size="sm" variant="secondary"><MessagesSquare className="h-4 w-4" aria-hidden />Open Messages</LinkButton>} />
          {listing.inquiries.length === 0 ? (
            <CardBody><EmptyState title="No messages yet" description="Messages from interested buyers will appear here." className="border-0 py-6" /></CardBody>
          ) : (
            <ul className="divide-y divide-slate-100">
              {listing.inquiries.map((i) => (
                <li key={i.id} className="px-5 py-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">{fullName(i.customer)}</p>
                    <p className="text-xs text-slate-600">{formatDate(i.createdAt, true)}</p>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{i.message}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        size="sm"
        title={confirm === 'SOLD' ? 'Mark this phone as sold?' : confirm === 'REMOVED' ? 'Take this listing down?' : 'Relist this phone?'}
        description={confirm === 'ACTIVE' ? 'It will appear in search results again.' : 'It will no longer appear in search results. You can relist it later.'}
        footer={<><Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button><Button onClick={changeStatus} loading={statusSaving}>Confirm</Button></>}
      >
        {confirm === 'REMOVED' && <Alert tone="info">Buyers who already messaged you can still contact you directly.</Alert>}
      </Modal>
    </DashboardLayout>
  );
}
