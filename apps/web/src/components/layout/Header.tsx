import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ChevronDown, LogOut, Menu, Plus, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { dashboardNav, ROLE_LABEL } from '@/lib/nav';
import { cn } from '@/lib/cn';
import { LinkButton, Button } from '@/components/ui/Button';
import { Dropdown, menuItemClass } from '@/components/ui/Dropdown';
import { Avatar } from '@/components/ui/Avatar';
import { Logo } from './Logo';
import { NotificationBell } from './NotificationBell';

const primaryNav = [
  { href: '/marketplace', label: 'Buy a phone' },
  { href: '/shops', label: 'Inspection shops' },
  { href: '/verify', label: 'Verify a report' },
];

const canSell = (role?: string) => role === 'CUSTOMER' || role === 'SELLER' || role === 'SHOP_OWNER';

export function Header() {
  const { user, status, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const close = () => setMobileOpen(false);
    router.events.on('routeChangeStart', close);
    return () => router.events.off('routeChangeStart', close);
  }, [router.events]);

  const isActive = (href: string) => router.pathname === href || router.pathname.startsWith(`${href}/`);
  const name = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email : '';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="page-container flex h-16 items-center gap-6">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive(item.href) ? 'text-brand-800' : 'text-slate-600 hover:text-ink'
              )}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Fixed-width slot: auth controls never shift the layout while the session loads. */}
        <div className="ml-auto flex min-w-[196px] items-center justify-end gap-2" data-testid="header-auth">
          {status === 'loading' ? (
            <div className="hidden h-10 w-[196px] animate-pulse rounded-lg bg-slate-100 md:block" aria-hidden />
          ) : user ? (
            <>
              <NotificationBell />
              {canSell(user.role) && (
                <LinkButton href="/listings/new" variant="outline" className="hidden lg:inline-flex">
                  <Plus className="h-4 w-4" aria-hidden />
                  Sell a phone
                </LinkButton>
              )}
              <div className="hidden md:block">
                <Dropdown
                  triggerClassName="flex h-10 items-center gap-2 rounded-lg pl-1 pr-2 hover:bg-slate-100"
                  trigger={
                    <>
                      <Avatar name={name} />
                      <span className="max-w-[140px] truncate text-sm font-medium text-ink" data-testid="header-user-name">
                        {user.firstName || user.email}
                      </span>
                      <span className="sr-only"> account menu</span>
                      <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden />
                    </>
                  }
                >
                  {(close) => (
                    <>
                      <div className="border-b border-slate-100 px-3.5 pb-2.5 pt-1.5">
                        <p className="truncate text-sm font-medium">{name}</p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                        <p className="mt-1 text-xs font-medium text-brand-700">{ROLE_LABEL[user.role]}</p>
                      </div>
                      <div className="py-1">
                        {dashboardNav(user.role).map((item) => (
                          <Link key={item.href} href={item.href} role="menuitem" className={menuItemClass} onClick={close}>
                            <item.icon className="h-4 w-4 text-slate-400" />
                            {item.label}
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-slate-100 pt-1">
                        <button type="button" role="menuitem" className={menuItemClass} onClick={() => { close(); logout(); }}>
                          <LogOut className="h-4 w-4 text-slate-400" />
                          Log out
                        </button>
                      </div>
                    </>
                  )}
                </Dropdown>
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <LinkButton href="/auth/login" variant="ghost" className="w-[84px]">Log in</LinkButton>
              <LinkButton href="/auth/register" variant="primary" className="w-[104px]">Sign up</LinkButton>
            </div>
          )}

          <button
            type="button"
            className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div id="mobile-nav" className="border-t border-slate-200 bg-white md:hidden">
          <nav aria-label="Mobile" className="page-container space-y-1 py-3">
            {primaryNav.map((item) => (
              <Link key={item.href} href={item.href} className={cn('block rounded-lg px-3 py-2.5 text-base font-medium', isActive(item.href) ? 'bg-brand-50 text-brand-800' : 'text-slate-700 hover:bg-slate-50')}>
                {item.label}
              </Link>
            ))}
            {user && (
              <>
                <div className="my-2 border-t border-slate-100" />
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar name={name} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="truncate text-xs text-slate-500">{ROLE_LABEL[user.role]}</p>
                  </div>
                </div>
                {dashboardNav(user.role).map((item) => (
                  <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base text-slate-700 hover:bg-slate-50">
                    <item.icon className="h-4 w-4 text-slate-400" />
                    {item.label}
                  </Link>
                ))}
              </>
            )}
            <div className="grid grid-cols-2 gap-2 pt-3">
              {status === 'loading' ? null : user ? (
                <>
                  {canSell(user.role) && <LinkButton href="/listings/new" variant="outline">Sell a phone</LinkButton>}
                  <Button variant="ghost" onClick={logout} className={canSell(user.role) ? '' : 'col-span-2'}>Log out</Button>
                </>
              ) : (
                <>
                  <LinkButton href="/auth/login" variant="outline">Log in</LinkButton>
                  <LinkButton href="/auth/register" variant="primary">Sign up</LinkButton>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
