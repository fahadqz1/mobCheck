import { useState } from 'react';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { Pencil, Plus, Trash2, Wrench } from 'lucide-react';
import prisma from '@/lib/prisma';
import { requirePageAuth } from '@/lib/ssr-auth';
import { getInspectionFee } from '@/lib/settings';
import { DashboardLayout } from '@/components/layout/Layouts';
import { Card } from '@/components/ui/Card';
import { Badge, EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select, Textarea } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { NeedsShop } from '@/components/vendor/NeedsShop';
import { api, ApiError } from '@/lib/client';
import { formatPKR } from '@/lib/format';

type Service = { id: string; name: string; description: string | null; pricePkr: number; status: string };
type Props = { hasShop: boolean; services: Service[]; fee: number };

export const getServerSideProps: GetServerSideProps = (ctx) =>
  requirePageAuth(ctx, ['SHOP_OWNER'], async (user) => {
    const shop = await prisma.shop.findFirst({ where: { ownerId: user.id }, include: { services: { orderBy: { createdAt: 'asc' } } } });
    return {
      hasShop: !!shop,
      fee: await getInspectionFee(),
      services: (shop?.services || []).map((s) => ({ id: s.id, name: s.name, description: s.description, pricePkr: Number(s.pricePkr), status: s.status })),
    };
  });

const blank = { name: '', description: '', pricePkr: '', status: 'ACTIVE' };

export default function VendorServices({ hasShop, services, fee }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<null | { id?: string; values: typeof blank }>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Service | null>(null);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setFields({});
    try {
      const body = { ...editing.values, description: editing.values.description || undefined };
      await api(editing.id ? `/api/vendor/services/${editing.id}` : '/api/vendor/services', { method: editing.id ? 'PATCH' : 'POST', body });
      toast('success', editing.id ? 'Service updated' : 'Service added');
      setEditing(null);
      router.replace(router.asPath, undefined, { scroll: false });
    } catch (err) {
      setFields((err as ApiError).fields || {});
      if (!(err as ApiError).fields) toast('error', (err as ApiError).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await api(`/api/vendor/services/${deleting.id}`, { method: 'DELETE' });
      toast('success', 'Service removed');
      setDeleting(null);
      router.replace(router.asPath, undefined, { scroll: false });
    } catch (err) {
      toast('error', (err as ApiError).message);
    }
  };

  const setVal = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setEditing((ed) => ed && { ...ed, values: { ...ed.values, [k]: k === 'pricePkr' ? e.target.value.replace(/\D/g, '') : e.target.value } });

  return (
    <DashboardLayout
      title="Services & pricing"
      description={`The MobCheck inspection is a fixed ${formatPKR(fee)}. List your repair and other services here.`}
      actions={hasShop ? <Button onClick={() => { setFields({}); setEditing({ values: blank }); }}><Plus className="h-4 w-4" aria-hidden />Add service</Button> : undefined}
    >
      {!hasShop ? (
        <NeedsShop />
      ) : services.length === 0 ? (
        <EmptyState icon={Wrench} title="No services listed" description="Add repairs like screen or battery replacement with your prices." action={<Button onClick={() => setEditing({ values: blank })}>Add your first service</Button>} />
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100">
            {services.map((s) => (
              <li key={s.id} className="flex items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium">{s.name}{s.status === 'INACTIVE' && <Badge>Hidden</Badge>}</p>
                  {s.description && <p className="truncate text-sm text-slate-600">{s.description}</p>}
                </div>
                <p className="font-semibold tabular-nums">{s.pricePkr > 0 ? formatPKR(s.pricePkr) : 'On inspection'}</p>
                <Button variant="ghost" size="sm" aria-label={`Edit ${s.name}`} onClick={() => { setFields({}); setEditing({ id: s.id, values: { name: s.name, description: s.description || '', pricePkr: String(s.pricePkr), status: s.status } }); }}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" aria-label={`Delete ${s.name}`} onClick={() => setDeleting(s)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit service' : 'Add service'} footer={<><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save} loading={saving}>Save</Button></>}>
        {editing && (
          <div className="space-y-4">
            <Field label="Service name" error={fields.name} required>{(p) => <Input {...p} value={editing.values.name} onChange={setVal('name')} placeholder="Screen replacement (iPhone)" />}</Field>
            <Field label="Description" error={fields.description}>{(p) => <Textarea {...p} rows={2} value={editing.values.description} onChange={setVal('description')} />}</Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Price (Rs)" error={fields.pricePkr} hint="Use 0 for 'price on inspection'" required>{(p) => <Input {...p} inputMode="numeric" value={editing.values.pricePkr} onChange={setVal('pricePkr')} />}</Field>
              <Field label="Visibility" error={fields.status}>
                {(p) => (
                  <Select {...p} value={editing.values.status} onChange={setVal('status')}>
                    <option value="ACTIVE">Shown on profile</option>
                    <option value="INACTIVE">Hidden</option>
                  </Select>
                )}
              </Field>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} size="sm" title="Delete this service?" description={deleting?.name} footer={<><Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button><Button variant="danger" onClick={remove}>Delete</Button></>}>
        <p className="text-sm text-slate-600">It will be removed from your public profile.</p>
      </Modal>
    </DashboardLayout>
  );
}
