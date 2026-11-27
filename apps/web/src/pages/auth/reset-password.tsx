import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AuthShell } from '@/components/auth/AuthShell';
import { Field, Input } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { api, ApiError } from '@/lib/client';

export default function ResetPassword() {
  const router = useRouter();
  const token = typeof router.query.token === 'string' ? router.query.token : '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFields({});
    if (password !== confirm) {
      setFields({ confirm: 'Passwords do not match' });
      return;
    }
    setLoading(true);
    try {
      await api('/api/auth/reset-password', { body: { token, password } });
      router.replace('/auth/login?reset=1');
    } catch (err) {
      const e = err as ApiError;
      setError(e.message);
      setFields(e.fields || {});
      setLoading(false);
    }
  };

  if (router.isReady && !token) {
    return (
      <AuthShell title="Reset link missing">
        <Alert tone="warning" title="This page needs a valid reset link." />
        <p className="mt-4 text-sm"><Link href="/auth/forgot-password" className="link">Request a new link</Link></p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" subtitle="You'll be signed out of all devices after the change.">
      {error && <Alert tone="danger" title={error} className="mb-5" />}
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="New password" error={fields.password} hint="At least 8 characters, with a letter and a number.">
          {(p) => <Input {...p} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
        </Field>
        <Field label="Confirm new password" error={fields.confirm}>
          {(p) => <Input {...p} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />}
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={loading}>Update password</Button>
      </form>
    </AuthShell>
  );
}
