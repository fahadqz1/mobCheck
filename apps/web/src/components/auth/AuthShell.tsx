import { ShieldCheck, ClipboardCheck, Store } from 'lucide-react';
import { SiteLayout } from '@/components/layout/Layouts';

const points = [
  { icon: ClipboardCheck, title: 'Independent inspections', text: 'A structured checklist covering display, battery, cameras, PTA status and more.' },
  { icon: Store, title: 'Shops vetted by MobCheck', text: 'Only shops that pass our document checks can accept inspection bookings.' },
  { icon: ShieldCheck, title: 'Reports you can verify', text: 'Every report has a reference number anyone can check on MobCheck.' },
];

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children: React.ReactNode }) {
  return (
    <SiteLayout title={title}>
      <div className="page-container grid gap-10 py-10 sm:py-16 lg:grid-cols-[1fr_440px] lg:gap-16">
        <section className="hidden lg:block">
          <h2 className="max-w-md text-3xl font-semibold leading-tight">Buy used phones with the facts in front of you.</h2>
          <ul className="mt-8 max-w-md space-y-6">
            {points.map((p) => (
              <li key={p.title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                  <p.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="mx-auto w-full max-w-[440px] rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </section>
      </div>
    </SiteLayout>
  );
}

export function safeNext(next: unknown, fallback = '/dashboard') {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/auth/') ? next : fallback;
}
