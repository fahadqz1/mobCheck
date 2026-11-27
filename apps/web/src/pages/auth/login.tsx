import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { AuthShell, safeNext } from '@/components/auth/AuthShell';
import { Field, Input } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { api, ApiError } from '@/lib/client';
import { ClientUser, notifyOtherTabs, useAuth } from '@/context/AuthContext';
import { getSsrUser } from '@/lib/ssr-auth';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getSsrUser(ctx);
  if (user) return { redirect: { destination: safeNext(ctx.query.next), permanent: false } };
  return { props: {} };
};

export default function Login() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFields({});
    try {
      const { user } = await api<{ user: ClientUser }>('/api/auth/login', { body: { email, password } });
      setUser(user);
      notifyOtherTabs();
      router.replace(safeNext(router.query.next));
    } catch (err) {
      const e = err as ApiError;
      setError(e.message);
      setFields(e.fields || {});
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Log in"
      subtitle={
        <>
          New to MobCheck? <Link href={{ pathname: '/auth/register', query: router.query.next ? { next: router.query.next } : {} }} className="link">Create an account</Link>
        </>
      }
    >
      {router.query.expired && !error && (
        <Alert tone="warning" title="Your session has ended" className="mb-5">Please log in again to continue.</Alert>
      )}
      {router.query.reset && !error && (
        <Alert tone="success" title="Password updated" className="mb-5">Log in with your new password.</Alert>
      )}
      {error && <Alert tone="danger" title={error} className="mb-5" />}
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email address" error={fields.email}>
          {(p) => <Input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />}
        </Field>
        <Field label="Password" error={fields.password}>
          {(p) => <Input {...p} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />}
        </Field>
        <div className="flex justify-end">
          <Link href="/auth/forgot-password" className="text-sm font-medium text-brand-700 hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={loading}>Log in</Button>
      </form>
    </AuthShell>
  );
}
