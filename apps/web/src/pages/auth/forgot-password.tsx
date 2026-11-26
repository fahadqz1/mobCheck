import { useState } from 'react';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/AuthShell';
import { Field, Input } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { api, ApiError } from '@/lib/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [result, setResult] = useState<{ message: string; devResetUrl?: string } | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldError('');
    try {
      setResult(await api('/api/auth/forgot-password', { body: { email } }));
    } catch (err) {
      const e = err as ApiError;
      setError(e.message);
      setFieldError(e.fields?.email || '');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="Enter the email you signed up with and we'll send you a reset link.">
      {result ? (
        <div className="space-y-4">
          <Alert tone="success" title="Check your email">{result.message}</Alert>
          {result.devResetUrl && (
            <Alert tone="info" title="Development mode">
              Email delivery is not configured yet.{' '}
              <a href={result.devResetUrl} className="font-medium underline">Open the reset link</a>
            </Alert>
          )}
          <Link href="/auth/login" className="link text-sm">Back to log in</Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error && <Alert tone="danger" title={error} />}
          <Field label="Email address" error={fieldError}>
            {(p) => <Input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={loading}>Send reset link</Button>
          <p className="text-center text-sm"><Link href="/auth/login" className="link">Back to log in</Link></p>
        </form>
      )}
    </AuthShell>
  );
}
