import { useState } from 'react';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { requirePageAuth } from '@/lib/ssr-auth';
import { loadBrandOptions } from '@/lib/brands';
import { SiteLayout, PageHeader } from '@/components/layout/Layouts';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Feedback';
import { Button, LinkButton } from '@/components/ui/Button';
import { BrandOption, emptyListing, ListingFields, ListingFormValues, toPayload } from '@/components/listings/ListingForm';
import { PhotoPicker, PickedPhoto } from '@/components/listings/PhotoPicker';
import { api, ApiError } from '@/lib/client';
import type { ClientUser } from '@/context/AuthContext';

type Props = { user: ClientUser; brands: BrandOption[] };

export const getServerSideProps: GetServerSideProps = (ctx) =>
  requirePageAuth(ctx, ['CUSTOMER', 'SELLER', 'SHOP_OWNER'], async () => ({ brands: await loadBrandOptions() }));

export default function NewListing({ brands }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<ListingFormValues>(emptyListing);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [photoError, setPhotoError] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setError('');
    setPhotoError('');
    if (photos.length === 0) {
      setPhotoError('Add at least one photo so buyers can see the phone.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true);
    let listingId = '';
    try {
      setStatus('Creating listing…');
      const { data } = await api<{ data: { id: string } }>('/api/listings', { body: toPayload(values) });
      listingId = data.id;
      for (let i = 0; i < photos.length; i++) {
        setStatus(`Uploading photo ${i + 1} of ${photos.length}…`);
        const form = new FormData();
        form.append('file', photos[i].file!);
        await api(`/api/listings/${listingId}/photos`, { formData: form });
      }
      router.push(`/listings/${listingId}?created=1`);
    } catch (err) {
      const e = err as ApiError;
      if (listingId) {
        // The listing exists; send the seller to manage photos rather than creating a duplicate.
        router.push(`/dashboard/listings/${listingId}?photoError=${encodeURIComponent(e.message)}`);
        return;
      }
      setErrors(e.fields || {});
      setError(e.message);
      setSaving(false);
      setStatus('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <SiteLayout title="Sell your phone">
      <div className="page-container max-w-3xl py-8">
        <PageHeader title="Sell your phone" description="Listings are free. Accurate details and clear photos sell faster." />
        {error && <Alert tone="danger" title={error} className="mb-6" />}
        <form onSubmit={submit} noValidate>
          <Card className="space-y-8 p-5 sm:p-6">
            <section>
              <h2 className="mb-3 text-base font-semibold">Photos</h2>
              <PhotoPicker
                photos={photos}
                error={photoError}
                onAdd={(files) => {
                  setPhotoError('');
                  setPhotos((p) => [...p, ...files.map((f) => ({ id: `${f.name}-${f.size}-${Math.random()}`, url: URL.createObjectURL(f), file: f }))]);
                }}
                onRemove={(id) => setPhotos((p) => p.filter((x) => x.id !== id))}
              />
            </section>
            <ListingFields values={values} onChange={setValues} errors={errors} brands={brands} />
          </Card>
          <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
            {status && <span className="mr-auto text-sm text-slate-600" aria-live="polite">{status}</span>}
            <LinkButton href="/dashboard/listings" variant="ghost">Cancel</LinkButton>
            <Button type="submit" size="lg" loading={saving}>Publish listing</Button>
          </div>
        </form>
      </div>
    </SiteLayout>
  );
}
