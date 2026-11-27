import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { ShoppingBag, Store } from 'lucide-react';
import { AuthShell, safeNext } from '@/components/auth/AuthShell';
import { Field, Input } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { api, ApiError } from '@/lib/client';
import { cn } from '@/lib/cn';
import { ClientUser, notifyOtherTabs, useAuth } from '@/context/AuthContext';
import { getSsrUser } from '@/lib/ssr-auth';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getSsrUser(ctx);
  if (user) return { redirect: { destination: '/dashboard', permanent: false } };
  return { props: {} };
};

const roles = [
  { value: 'CUSTOMER', label: 'Buy or sell a phone', icon: ShoppingBag },
  { value: 'SHOP_OWNER', label: 'Register my shop', icon: Store },
] as const;

export default function Register() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: router.query.role === 'SHOP_OWNER' ? 'SHOP_OWNER' : 'CUSTOMER',
  });
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFields({});
    try {
      const { user } = await api<{ user: ClientUser }>('/api/auth/register', { body: form });
      setUser(user);
      notifyOtherTabs();
      router.replace(user.role === 'SHOP_OWNER' ? '/vendor/shop' : safeNext(router.query.next));
    } catch (err) {
      const e = err as ApiError;
      setError(e.message);
      setFields(e.fields || {});
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle={<>Already have an account? <Link href="/auth/login" className="link">Log in</Link></>}>
      {error && <Alert tone="danger" title={error} className="mb-5" />}
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <fieldset>
          <legend className="text-label mb-2">I want to</legend>
          <div className="grid grid-cols-2 gap-2">
            {roles.map((r) => (
              <label
                key={r.value}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                  form.role === r.value ? 'border-brand-600 bg-brand-50 text-brand-800 ring-1 ring-brand-600' : 'border-slate-300 text-slate-700 hover:border-slate-400'
                )}
              >
                <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={() => setForm((f) => ({ ...f, role: r.value }))} className="sr-only" />
                <r.icon className="h-4 w-4 shrink-0" aria-hidden />
                {r.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First name" error={fields.firstName} required>
            {(p) => <Input {...p} autoComplete="given-name" value={form.firstName} onChange={set('firstName')} />}
          </Field>
          <Field label="Last name" error={fields.lastName} required>
            {(p) => <Input {...p} autoComplete="family-name" value={form.lastName} onChange={set('lastName')} />}
          </Field>
        </div>
        <Field label="Email address" error={fields.email} required>
          {(p) => <Input {...p} type="email" autoComplete="email" value={form.email} onChange={set('email')} />}
        </Field>
        <Field label="Mobile number" error={fields.phone} hint="Optional. Buyers can reach you on WhatsApp.">
          {(p) => <Input {...p} type="tel" autoComplete="tel" placeholder="0300 1234567" value={form.phone} onChange={set('phone')} />}
        </Field>
        <Field label="Password" error={fields.password} hint="At least 8 characters, with a letter and a number." required>
          {(p) => <Input {...p} type="password" autoComplete="new-password" value={form.password} onChange={set('password')} />}
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={loading}>Create account</Button>
        <p className="text-center text-xs text-slate-600">By creating an account you agree to MobCheck&apos;s terms of use.</p>
      </form>
    </AuthShell>
  );
}
