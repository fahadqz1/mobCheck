import { useState } from 'react';
import type { GetServerSideProps } from 'next';
import prisma from '@/lib/prisma';
import { requirePageAuth } from '@/lib/ssr-auth';
import { DashboardLayout } from '@/components/layout/Layouts';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Field, Input, Select } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { ClientUser, useAuth } from '@/context/AuthContext';
import { api, ApiError } from '@/lib/client';
import { CITIES, formatDate } from '@/lib/format';
import { ROLE_LABEL } from '@/lib/nav';

type Props = { user: ClientUser; profile: { city: string | null; area: string | null } | null };

export const getServerSideProps: GetServerSideProps = (ctx) =>
  requirePageAuth(ctx, undefined, async (user) => ({
    profile: await prisma.customerProfile.findUnique({ where: { userId: user.id }, select: { city: true, area: true } }),
  }));

export default function Profile({ user, profile }: Props) {
  const { setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
    city: profile?.city || '',
    area: profile?.area || '',
  });
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [pwFields, setPwFields] = useState<Record<string, string>>({});
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFields({});
    try {
      const { user: updated } = await api<{ user: ClientUser }>('/api/auth/me', { method: 'PATCH', body: form });
      setUser(updated);
      toast('success', 'Profile saved');
    } catch (err) {
      setFields((err as ApiError).fields || {});
      toast('error', (err as ApiError).message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSaving(true);
    setPwFields({});
    setPwError('');
    try {
      await api('/api/auth/password', { body: pw });
      setPw({ currentPassword: '', newPassword: '' });
      toast('success', 'Password changed. Other devices have been signed out.');
    } catch (err) {
      setPwFields((err as ApiError).fields || {});
      setPwError((err as ApiError).message);
    } finally {
      setPwSaving(false);
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const isCustomer = user.role === 'CUSTOMER' || user.role === 'SELLER';

  return (
    <DashboardLayout title="Profile & settings" description={`${ROLE_LABEL[user.role]} account · member since ${formatDate(user.createdAt)}`}>
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card as="section">
          <CardHeader title="Personal details" description="Shown to shops and buyers you interact with." />
          <CardBody>
            <form onSubmit={save} className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name" error={fields.firstName} required>{(p) => <Input {...p} value={form.firstName} onChange={set('firstName')} autoComplete="given-name" />}</Field>
                <Field label="Last name" error={fields.lastName} required>{(p) => <Input {...p} value={form.lastName} onChange={set('lastName')} autoComplete="family-name" />}</Field>
              </div>
              <Field label="Email address" hint="Contact support to change your email.">{(p) => <Input {...p} value={user.email} disabled />}</Field>
              <Field label="Mobile number" error={fields.phone} hint="Used for WhatsApp contact on your listings.">{(p) => <Input {...p} type="tel" value={form.phone} onChange={set('phone')} placeholder="0300 1234567" autoComplete="tel" />}</Field>
              {isCustomer && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="City" error={fields.city}>
                    {(p) => (
                      <Select {...p} value={form.city} onChange={set('city')}>
                        <option value="">Select city</option>
                        {CITIES.map((c) => <option key={c}>{c}</option>)}
                      </Select>
                    )}
                  </Field>
                  <Field label="Area" error={fields.area}>{(p) => <Input {...p} value={form.area} onChange={set('area')} placeholder="e.g. Gulberg" />}</Field>
                </div>
              )}
              <div className="flex justify-end pt-2">
                <Button type="submit" loading={saving}>Save changes</Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card as="section" className="self-start">
          <CardHeader title="Password" description="Changing it signs out your other devices." />
          <CardBody>
            <form onSubmit={changePassword} className="space-y-4" noValidate>
              {pwError && <Alert tone="danger" title={pwError} />}
              <Field label="Current password" error={pwFields.currentPassword}>{(p) => <Input {...p} type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw((v) => ({ ...v, currentPassword: e.target.value }))} />}</Field>
              <Field label="New password" error={pwFields.newPassword} hint="At least 8 characters, with a letter and a number.">{(p) => <Input {...p} type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw((v) => ({ ...v, newPassword: e.target.value }))} />}</Field>
              <Button type="submit" variant="outline" className="w-full" loading={pwSaving}>Change password</Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}
