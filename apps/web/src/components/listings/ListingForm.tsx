import { useMemo, useState } from 'react';
import { Field, Input, Select, Textarea, Checkbox } from '@/components/ui/Form';
import { CITIES, CONDITION_LABEL } from '@/lib/format';

export type BrandOption = { id: string; name: string; models: { id: string; name: string }[] };

export type ListingFormValues = {
  brandId: string;
  modelId: string;
  storageGb: string;
  ramGb: string;
  color: string;
  condition: string;
  pricePkr: string;
  ptaStatus: string;
  batteryHealth: string;
  repairHistory: string;
  hasBox: boolean;
  hasCharger: boolean;
  hasAccessories: string;
  title: string;
  description: string;
  locationCity: string;
  locationArea: string;
  sellerContactPreference: string;
};

export const emptyListing: ListingFormValues = {
  brandId: '',
  modelId: '',
  storageGb: '',
  ramGb: '',
  color: '',
  condition: '',
  pricePkr: '',
  ptaStatus: 'UNKNOWN',
  batteryHealth: '',
  repairHistory: '',
  hasBox: false,
  hasCharger: false,
  hasAccessories: '',
  title: '',
  description: '',
  locationCity: '',
  locationArea: '',
  sellerContactPreference: 'PLATFORM',
};

export function toPayload(v: ListingFormValues) {
  return {
    ...v,
    storageGb: v.storageGb || undefined,
    ramGb: v.ramGb || undefined,
    batteryHealth: v.batteryHealth || undefined,
    color: v.color || undefined,
    repairHistory: v.repairHistory || undefined,
    description: v.description || undefined,
    hasAccessories: v.hasAccessories.split(',').map((s) => s.trim()).filter(Boolean),
  };
}

export function ListingFields({
  values,
  onChange,
  errors,
  brands,
}: {
  values: ListingFormValues;
  onChange: (v: ListingFormValues) => void;
  errors: Record<string, string>;
  brands: BrandOption[];
}) {
  const models = useMemo(() => brands.find((b) => b.id === values.brandId)?.models || [], [brands, values.brandId]);
  const set = (k: keyof ListingFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    onChange({ ...values, [k]: e.target.value });
  const [titleTouched, setTitleTouched] = useState(Boolean(values.title));

  const suggestTitle = (next: ListingFormValues) => {
    if (titleTouched) return next;
    const brand = brands.find((b) => b.id === next.brandId);
    const model = brand?.models.find((m) => m.id === next.modelId);
    const parts = [brand && model ? `${model.name.startsWith(brand.name) ? '' : brand.name + ' '}${model.name}` : '', next.storageGb ? `${next.storageGb}GB` : '', next.color].filter(Boolean);
    return { ...next, title: parts.join(' ') };
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-base font-semibold">The phone</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Brand" error={errors.brandId} required>
            {(p) => (
              <Select {...p} value={values.brandId} onChange={(e) => onChange(suggestTitle({ ...values, brandId: e.target.value, modelId: '' }))}>
                <option value="">Choose brand</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Model" error={errors.modelId} required>
            {(p) => (
              <Select {...p} value={values.modelId} onChange={(e) => onChange(suggestTitle({ ...values, modelId: e.target.value }))} disabled={!values.brandId}>
                <option value="">{values.brandId ? 'Choose model' : 'Choose a brand first'}</option>
                {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Storage (GB)" error={errors.storageGb}>{(p) => <Input {...p} inputMode="numeric" value={values.storageGb} onChange={(e) => onChange(suggestTitle({ ...values, storageGb: e.target.value.replace(/\D/g, '') }))} placeholder="128" />}</Field>
          <Field label="RAM (GB)" error={errors.ramGb}>{(p) => <Input {...p} inputMode="numeric" value={values.ramGb} onChange={(e) => onChange({ ...values, ramGb: e.target.value.replace(/\D/g, '') })} placeholder="8" />}</Field>
          <Field label="Colour" error={errors.color}>{(p) => <Input {...p} value={values.color} onChange={(e) => onChange(suggestTitle({ ...values, color: e.target.value }))} placeholder="e.g. Natural Titanium" />}</Field>
          <Field label="PTA status" error={errors.ptaStatus} required>
            {(p) => (
              <Select {...p} value={values.ptaStatus} onChange={set('ptaStatus')}>
                <option value="UNKNOWN">I&apos;m not sure</option>
                <option value="APPROVED">PTA approved</option>
                <option value="NON_PTA">Non-PTA</option>
              </Select>
            )}
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold">Condition</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Overall condition" error={errors.condition} required>
            {(p) => (
              <Select {...p} value={values.condition} onChange={set('condition')}>
                <option value="">Choose condition</option>
                {Object.entries(CONDITION_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Battery health (%)" error={errors.batteryHealth} hint="From Settings › Battery, if your phone shows it.">{(p) => <Input {...p} inputMode="numeric" value={values.batteryHealth} onChange={(e) => onChange({ ...values, batteryHealth: e.target.value.replace(/\D/g, '').slice(0, 3) })} placeholder="e.g. 88" />}</Field>
        </div>
        <Field label="Repair history" error={errors.repairHistory} hint="List any part replaced or repaired. Leave empty if never repaired.">{(p) => <Textarea {...p} rows={2} value={values.repairHistory} onChange={set('repairHistory')} placeholder="e.g. Screen replaced at an authorised centre in March 2025" />}</Field>
        <fieldset>
          <legend className="text-label mb-2">Included in the sale</legend>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Checkbox label="Original box" checked={values.hasBox} onChange={(e) => onChange({ ...values, hasBox: e.target.checked })} />
            <Checkbox label="Charger" checked={values.hasCharger} onChange={(e) => onChange({ ...values, hasCharger: e.target.checked })} />
          </div>
        </fieldset>
        <Field label="Other accessories" error={errors.hasAccessories} hint="Separate with commas.">{(p) => <Input {...p} value={values.hasAccessories} onChange={set('hasAccessories')} placeholder="Case, screen protector" />}</Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold">Listing</h2>
        <Field label="Title" error={errors.title} required>{(p) => <Input {...p} value={values.title} onChange={(e) => { setTitleTouched(true); set('title')(e); }} maxLength={90} />}</Field>
        <Field label="Asking price (Rs)" error={errors.pricePkr} required>{(p) => <Input {...p} inputMode="numeric" value={values.pricePkr} onChange={(e) => onChange({ ...values, pricePkr: e.target.value.replace(/\D/g, '') })} placeholder="e.g. 185000" />}</Field>
        <Field label="Description" error={errors.description} hint="Mention scratches, faults, and why you're selling.">{(p) => <Textarea {...p} rows={5} value={values.description} onChange={set('description')} maxLength={2000} />}</Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" error={errors.locationCity} required>
            {(p) => (
              <Select {...p} value={values.locationCity} onChange={set('locationCity')}>
                <option value="">Choose city</option>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Area" error={errors.locationArea} required>{(p) => <Input {...p} value={values.locationArea} onChange={set('locationArea')} placeholder="e.g. Gulberg III" />}</Field>
        </div>
        <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Buyers contact you through MobCheck Messages. Your phone number and email stay private.</p>
      </section>
    </div>
  );
}
