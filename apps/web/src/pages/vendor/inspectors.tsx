import { useState } from 'react';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { Copy, Pencil, UserPlus, Users } from 'lucide-react';
import prisma from '@/lib/prisma';
import { requirePageAuth } from '@/lib/ssr-auth';
import { DashboardLayout } from '@/components/layout/Layouts';
import { Card } from '@/components/ui/Card';
import { Alert, Badge, EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Checkbox, Field, Input, Select } from '@/components/ui/Form';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { NeedsShop } from '@/components/vendor/NeedsShop';
import { api, ApiError } from '@/lib/client';
import { fullName } from '@/lib/format';

const DAYS = [
  ['availableMonday', 'Mon'],
  ['availableTuesday', 'Tue'],
  ['availableWednesday', 'Wed'],
  ['availableThursday', 'Thu'],
  ['availableFriday', 'Fri'],
  ['availableSaturday', 'Sat'],
  ['availableSunday', 'Sun'],
] as const;
type DayKey = (typeof DAYS)[number][0];
type Availability = Record<DayKey, boolean> & { startTime: string; endTime: string };
type Inspector = Availability & { id: string; name: string; email: string; status: string; completed: number };
type Props = { hasShop: boolean; inspectors: Inspector[] };

export const getServerSideProps: GetServerSideProps = (ctx) =>
  requirePageAuth(ctx, ['SHOP_OWNER'], async (user) => {
    const shop = await prisma.shop.findFirst({
      where: { ownerId: user.id },
      include: { inspectors: { include: { user: { select: { firstName: true, lastName: true, email: true } } }, orderBy: { createdAt: 'asc' } } },
    });
    return {
      hasShop: !!shop,
      inspectors: (shop?.inspectors || []).map((i) => ({
        id: i.id,
        name: fullName(i.user),
        email: i.user.email,
        status: i.status,
        completed: i.completedInspections,
        startTime: i.startTime || '',
        endTime: i.endTime || '',
        ...Object.fromEntries(DAYS.map(([k]) => [k, i[k]])),
      })),
    };
  });

const defaultAvailability: Availability = {
  availableMonday: true,
  availableTuesday: true,
  availableWednesday: true,
  availableThursday: true,
  availableFriday: true,
  availableSaturday: true,
  availableSunday: false,
  startTime: '11:00',
  endTime: '20:00',
};

export default function VendorInspectors({ hasShop, inspectors }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', ...defaultAvailability });
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ email: string; temporaryPassword: string } | null>(null);
  const [editing, setEditing] = useState<Inspector | null>(null);

  const refresh = () => router.replace(router.asPath, undefined, { scroll: false });

  const add = async () => {
    setSaving(true);
    setFields({});
    try {
      const { data } = await api<{ data: { email: string; temporaryPassword: string } }>('/api/vendor/inspectors', { body: { ...form, startTime: form.startTime || undefined, endTime: form.endTime || undefined } });
      setAdding(false);
      setCreated(data);
      setForm({ firstName: '', lastName: '', email: '', phone: '', ...defaultAvailability });
      refresh();
    } catch (err) {
      setFields((err as ApiError).fields || {});
      if (!(err as ApiError).fields) toast('error', (err as ApiError).message);
    } finally {
      setSaving(false);
    }
  };

  const update = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const { id, status, startTime, endTime } = editing;
      const rest = { status, startTime, endTime, ...Object.fromEntries(DAYS.map(([k]) => [k, editing[k]])) };
      await api(`/api/vendor/inspectors/${id}`, { method: 'PATCH', body: { ...rest, startTime: rest.startTime || undefined, endTime: rest.endTime || undefined } });
      toast('success', 'Inspector updated');
      setEditing(null);
      refresh();
    } catch (err) {
      toast('error', (err as ApiError).message);
    } finally {
      setSaving(false);
    }
  };

  const dayPicker = (value: Availability, onChange: (v: Availability) => void) => (
    <>
      <fieldset>
        <legend className="text-label mb-2">Available days</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {DAYS.map(([k, label]) => <Checkbox key={k} label={label} checked={value[k]} onChange={(e) => onChange({ ...value, [k]: e.target.checked })} />)}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-4">
        <Field label="From">{(p) => <Input {...p} type="time" value={value.startTime} onChange={(e) => onChange({ ...value, startTime: e.target.value })} />}</Field>
        <Field label="Until">{(p) => <Input {...p} type="time" value={value.endTime} onChange={(e) => onChange({ ...value, endTime: e.target.value })} />}</Field>
      </div>
    </>
  );

  return (
    <DashboardLayout
      title="Inspectors"
      description="People at your shop who carry out MobCheck inspections. Customers can only book when at least one is active."
      actions={hasShop ? <Button onClick={() => { setFields({}); setAdding(true); }}><UserPlus className="h-4 w-4" aria-hidden />Add inspector</Button> : undefined}
    >
      {!hasShop ? (
        <NeedsShop />
      ) : inspectors.length === 0 ? (
        <EmptyState icon={Users} title="No inspectors yet" description="Add yourself or a staff member. They get their own login to run inspections." action={<Button onClick={() => setAdding(true)}>Add inspector</Button>} />
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100">
            {inspectors.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <Avatar name={i.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{i.name}</p>
                  <p className="truncate text-sm text-slate-600">{i.email}</p>
                  <p className="mt-1 text-xs text-slate-600">{DAYS.filter(([k]) => i[k]).map(([, l]) => l).join(', ') || 'No days'}{i.startTime && i.endTime ? ` · ${i.startTime}–${i.endTime}` : ''} · {i.completed} completed</p>
                </div>
                <Badge tone={i.status === 'ACTIVE' ? 'success' : 'neutral'}>{i.status === 'ACTIVE' ? 'Active' : 'Inactive'}</Badge>
                <Button variant="ghost" size="sm" onClick={() => setEditing(i)} aria-label={`Edit ${i.name}`}><Pencil className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add an inspector" description="We create a MobCheck login for them and show you a temporary password." footer={<><Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button><Button onClick={add} loading={saving}>Add inspector</Button></>}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" error={fields.firstName} required>{(p) => <Input {...p} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />}</Field>
            <Field label="Last name" error={fields.lastName} required>{(p) => <Input {...p} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />}</Field>
          </div>
          <Field label="Email" error={fields.email} required>{(p) => <Input {...p} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />}</Field>
          <Field label="Mobile number" error={fields.phone}>{(p) => <Input {...p} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0300 1234567" />}</Field>
          {dayPicker(form, (v) => setForm({ ...form, ...v }))}
        </div>
      </Modal>

      <Modal open={!!created} onClose={() => setCreated(null)} title="Inspector added" footer={<Button onClick={() => setCreated(null)}>Done</Button>}>
        {created && (
          <div className="space-y-4">
            <Alert tone="warning" title="Copy this password now">It won&apos;t be shown again. Ask the inspector to change it after their first login.</Alert>
            <dl className="space-y-2 rounded-lg bg-slate-50 p-4 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-slate-600">Email</dt><dd className="font-medium">{created.email}</dd></div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-600">Temporary password</dt>
                <dd className="flex items-center gap-2 font-mono font-medium" data-testid="temp-password">
                  {created.temporaryPassword}
                  <button type="button" aria-label="Copy password" onClick={() => navigator.clipboard?.writeText(created.temporaryPassword).then(() => toast('success', 'Copied'))} className="rounded p-1 text-slate-600 hover:bg-slate-200"><Copy className="h-4 w-4" /></button>
                </dd>
              </div>
            </dl>
          </div>
        )}
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing ? `Edit ${editing.name}` : ''} footer={<><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={update} loading={saving}>Save</Button></>}>
        {editing && (
          <div className="space-y-4">
            <Field label="Status" hint="Inactive inspectors are signed out and cannot log in.">
              {(p) => (
                <Select {...p} value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </Select>
              )}
            </Field>
            {dayPicker(editing, (v) => setEditing({ ...editing, ...v }))}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
