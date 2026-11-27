import { SearchX } from 'lucide-react';
import { SiteLayout } from '@/components/layout/Layouts';
import { LinkButton } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <SiteLayout title="Page not found">
      <div className="page-container flex max-w-lg flex-col items-center py-24 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100"><SearchX className="h-7 w-7 text-slate-500" aria-hidden /></span>
        <p className="mt-6 text-sm font-semibold text-brand-700">404</p>
        <h1 className="mt-1 text-3xl font-semibold">We couldn&apos;t find that page</h1>
        <p className="mt-3 text-slate-600">The link may be broken, or the listing or shop may have been removed.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <LinkButton href="/">Go home</LinkButton>
          <LinkButton href="/marketplace" variant="outline">Browse phones</LinkButton>
        </div>
      </div>
    </SiteLayout>
  );
}
