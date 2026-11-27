import { useState } from 'react';
import { useRouter } from 'next/router';
import { ShieldCheck } from 'lucide-react';
import { SiteLayout } from '@/components/layout/Layouts';
import { Card } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';

export default function Verify() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  return (
    <SiteLayout title="Verify a report">
      <div className="page-container max-w-lg py-16">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700"><ShieldCheck className="h-6 w-6" aria-hidden /></div>
        <h1 className="text-center text-2xl font-semibold">Verify an inspection report</h1>
        <p className="mt-2 text-center text-slate-600">Selling or buying with a MobCheck report? Check that it is genuine. The number is printed at the top of every report, e.g. MC-2026-1A2B3C4D.</p>
        <Card className="mt-8 p-6">
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              const n = value.trim().toUpperCase();
              if (!/^MC-\d{4}-[0-9A-F]{8}$/.test(n)) {
                setError('Enter the number exactly as printed, e.g. MC-2026-1A2B3C4D');
                return;
              }
              router.push(`/reports/${n}`);
            }}
            className="space-y-4"
          >
            <Field label="Report number" error={error}>{(p) => <Input {...p} value={value} onChange={(e) => { setValue(e.target.value); setError(''); }} placeholder="MC-2026-1A2B3C4D" autoCapitalize="characters" />}</Field>
            <Button type="submit" size="lg" className="w-full">Verify report</Button>
          </form>
        </Card>
      </div>
    </SiteLayout>
  );
}
