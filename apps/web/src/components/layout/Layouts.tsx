import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { dashboardNav } from '@/lib/nav';
import { cn } from '@/lib/cn';
import { Header } from './Header';
import { Footer } from './Footer';

export function PageTitle({ title }: { title: string }) {
  return (
    <Head>
      <title>{`${title} · MobCheck`}</title>
    </Head>
  );
}

export function SiteLayout({ title, children, footer = true }: { title: string; children: React.ReactNode; footer?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PageTitle title={title} />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:shadow-raised">
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">{children}</main>
      {footer && <Footer />}
    </div>
  );
}

export function PageHeader({ title, description, actions, breadcrumb }: { title: string; description?: React.ReactNode; actions?: React.ReactNode; breadcrumb?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {breadcrumb && <div className="mb-2 text-sm text-slate-600">{breadcrumb}</div>}
        <h1 className="text-2xl font-semibold sm:text-[28px] sm:leading-9">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-600 sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function DashboardLayout({ title, description, actions, children }: { title: string; description?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const items = user ? dashboardNav(user.role) : [];
  const active = (href: string) => (href === '/dashboard' ? router.pathname === href : router.pathname === href || router.pathname.startsWith(`${href}/`));

  return (
    <SiteLayout title={title} footer={false}>
      <div className="page-container py-6 lg:grid lg:grid-cols-[220px_1fr] lg:gap-8 lg:py-8">
        <aside className="mb-6 lg:mb-0">
          <nav aria-label="Dashboard" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active(item.href) ? 'page' : undefined}
                className={cn(
                  'flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  active(item.href) ? 'bg-ink text-white shadow-card' : 'text-slate-600 hover:bg-ink/5 hover:text-ink'
                )}
              >
                <item.icon className={cn('h-4 w-4', active(item.href) ? 'text-lime-300' : 'text-slate-400')} />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0">
          <PageHeader title={title} description={description} actions={actions} />
          {children}
        </div>
      </div>
    </SiteLayout>
  );
}
