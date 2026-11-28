import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowRight, ChevronDown, ClipboardCheck, ExternalLink, LogOut, Menu, Plus, Search, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { dashboardNav, ROLE_LABEL } from '@/lib/nav';
import { cn } from '@/lib/cn';
import { PTA_STATUS_URL } from '@/lib/help-content';
import { LinkButton, Button } from '@/components/ui/Button';
import { Dropdown, menuItemClass } from '@/components/ui/Dropdown';
import { Avatar } from '@/components/ui/Avatar';
import { Logo } from './Logo';
import { NotificationBell } from './NotificationBell';
import { MessagesLink } from './MessagesLink';

const primaryNav = [
  { href: '/marketplace', label: 'Buy a phone' },
  { href: '/shops', label: 'Inspection shops' },
  { href: '/verify', label: 'Verify a report' },
];

// Category row follows the pattern of phone marketplaces (PriceOye, Swappa, Back Market):
// one "Phones" menu with brand / budget / condition groups, then plain-text quick tabs.
const PHONE_MENU = [
  {
    title: 'Brands',
    links: [
      { href: '/marketplace', label: 'All phones' },
      { href: '/marketplace?brand=apple', label: 'iPhone' },
      { href: '/marketplace?brand=samsung', label: 'Samsung' },
      { href: '/marketplace?brand=google-pixel', label: 'Google Pixel' },
      { href: '/marketplace?brand=oneplus', label: 'OnePlus' },
    ],
  },
  {
    title: 'Budget',
    links: [
      { href: '/marketplace?maxPrice=50000', label: 'Under Rs 50,000' },
      { href: '/marketplace?minPrice=50000&maxPrice=100000', label: 'Rs 50,000 – 1 lakh' },
      { href: '/marketplace?minPrice=100000&maxPrice=200000', label: 'Rs 1 – 2 lakh' },
      { href: '/marketplace?minPrice=200000', label: 'Above Rs 2 lakh' },
    ],
  },
  {
    title: 'Condition',
    links: [
      { href: '/marketplace?pta=APPROVED', label: 'PTA approved' },
      { href: '/marketplace?condition=BRAND_NEW', label: 'Brand new' },
      { href: '/marketplace?condition=LIKE_NEW', label: 'Like new' },
      { href: '/marketplace?condition=EXCELLENT', label: 'Excellent' },
    ],
  },
];
const quickTabs = [
  { href: '/marketplace?brand=apple', label: 'iPhone' },
  { href: '/marketplace?brand=samsung', label: 'Samsung' },
  { href: '/marketplace?brand=google-pixel', label: 'Google Pixel' },
  { href: '/marketplace?brand=oneplus', label: 'OnePlus' },
  { href: '/marketplace?pta=APPROVED', label: 'PTA approved' },
];
const services = [
  { href: '/shops', label: 'Inspection shops' },
  { href: '/listings/new', label: 'Sell a phone' },
  { href: '/verify', label: 'Verify a report' },
];
const tabClass = (active: boolean) =>
  cn('inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-medium transition-colors', active ? 'bg-ink text-white' : 'text-slate-700 hover:bg-ink/5 hover:text-ink');

// `relative` keeps the sr-only text from escaping the scrolling chip row and widening the page.
const PTA_TITLE = 'Check a phone on the official PTA DIRBS website (opens in a new tab). MobCheck is not affiliated with PTA.';

function PtaStatusLink({ className }: { className: string }) {
  return (
    <a href={PTA_STATUS_URL} target="_blank" rel="noopener noreferrer" title={PTA_TITLE} className={cn('relative', className)} data-testid="pta-status-link">
      PTA Status
      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

const canSell = (role?: string) => role === 'CUSTOMER' || role === 'SELLER' || role === 'SHOP_OWNER';

function SearchPill({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState(typeof router.query.q === 'string' ? router.query.q : '');
  return (
    <form
      role="search"
      className={cn('relative', className)}
      onSubmit={(e) => {
        e.preventDefault();
        router.push({ pathname: '/marketplace', query: q.trim() ? { q: q.trim() } : {} });
      }}
    >
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" aria-hidden />
      <input
        type="search"
        aria-label="Search MobCheck"
        autoFocus={autoFocus}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search iPhone 15, Galaxy S24, Pixel…"
        className="h-11 w-full rounded-full border border-ink/10 bg-white/80 pl-11 pr-4 text-sm text-ink shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] placeholder:text-slate-600 focus:border-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-ink/10"
      />
    </form>
  );
}

export function Header() {
  const { user, status, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [phonesOpen, setPhonesOpen] = useState(false);
  const phonesBtn = useRef<HTMLButtonElement>(null);
  const phonesPanel = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>();
  const onHome = router.pathname === '/';

  useEffect(() => {
    const close = () => {
      setMobileOpen(false);
      setPhonesOpen(false);
    };
    router.events.on('routeChangeStart', close);
    return () => router.events.off('routeChangeStart', close);
  }, [router.events]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      setPastHero(window.scrollY > 520);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!phonesOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPhonesOpen(false);
        phonesBtn.current?.focus();
      }
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!phonesPanel.current?.contains(t) && !phonesBtn.current?.contains(t)) setPhonesOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [phonesOpen]);
  const hoverOpen = () => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setPhonesOpen(true), 120);
  };
  const hoverClose = () => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setPhonesOpen(false), 200);
  };

  const isActive = (href: string) => {
    const [path, qs] = href.split('?');
    if (router.pathname !== path && !router.pathname.startsWith(`${path}/`)) return false;
    if (!qs) return path !== '/marketplace' || (!router.query.brand && !router.query.pta);
    const [k, v] = qs.split('=');
    return router.query[k] === v;
  };
  const name = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email : '';

  return (
    <>
      <div className="bg-ink text-white">
        <p className="page-container flex h-9 items-center justify-center gap-2 text-center text-xs font-medium sm:text-[13px]">
          <ClipboardCheck className="h-4 w-4 shrink-0 text-lime-300" aria-hidden />
          <span className="truncate">Never buy blind: get any used phone professionally inspected before you pay.</span>
          <Link href="/shops" className="hidden shrink-0 items-center gap-1 font-semibold text-lime-300 hover:underline sm:inline-flex">
            Find a shop <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </p>
      </div>

      <header className={cn('glass-strong sticky top-0 z-40 border-x-0 border-t-0 border-b border-ink/10 transition-shadow', scrolled ? 'shadow-raised' : 'shadow-none')}>
        <div className="page-container flex h-16 items-center gap-4 lg:gap-6">
          <Logo />
          {/* On the home page the hero has its own search, so the header one waits until the hero scrolls away.
              `invisible` keeps its space so nothing shifts. */}
          <SearchPill className={cn('hidden max-w-xl flex-1 transition-all duration-300 md:block', onHome && !pastHero && 'md:invisible md:-translate-y-1 md:opacity-0')} />

          {/* Fixed-width slot: auth controls never shift the layout while the session loads. */}
          <div className="ml-auto flex min-w-[196px] items-center justify-end gap-2" data-testid="header-auth">
            {status === 'loading' ? (
              <div className="hidden h-10 w-[196px] animate-pulse rounded-full bg-ink/5 md:block" aria-hidden />
            ) : user ? (
              <>
                {user.role !== 'INSPECTOR' && <MessagesLink />}
                <NotificationBell />
                {canSell(user.role) && (
                  <LinkButton href="/listings/new" variant="accent" className="hidden md:inline-flex">
                    <Plus className="h-4 w-4" aria-hidden />
                    Sell a phone
                  </LinkButton>
                )}
                <div className="hidden md:block">
                  <Dropdown
                    triggerClassName="flex h-10 items-center gap-2 rounded-full pl-1 pr-3 ring-1 ring-ink/10 hover:bg-white hover:ring-ink/25"
                    trigger={
                      <>
                        <Avatar name={name} />
                        <span className="max-w-[140px] truncate text-sm font-semibold text-ink" data-testid="header-user-name">
                          {user.firstName || user.email}
                        </span>
                        <span className="sr-only"> account menu</span>
                        <ChevronDown className="h-4 w-4 text-slate-600" aria-hidden />
                      </>
                    }
                  >
                    {(close) => (
                      <>
                        <div className="border-b border-slate-100 px-3.5 pb-2.5 pt-1.5">
                          <p className="truncate text-sm font-semibold">{name}</p>
                          <p className="truncate text-xs text-slate-600">{user.email}</p>
                          <p className="mt-1 inline-flex rounded-full bg-lime-200 px-2 py-0.5 text-xs font-semibold text-ink">{ROLE_LABEL[user.role]}</p>
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
              className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-ink/5 md:hidden"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <nav aria-label="Categories" className="relative hidden border-t border-ink/5 md:block" onMouseLeave={hoverClose}>
          <ul className="page-container no-scrollbar flex h-11 items-center gap-1 overflow-x-auto">
            <li onMouseEnter={hoverOpen}>
              <button
                ref={phonesBtn}
                type="button"
                aria-expanded={phonesOpen}
                aria-controls="phones-menu"
                onClick={() => {
                  clearTimeout(hoverTimer.current);
                  setPhonesOpen((v) => !v);
                }}
                className={tabClass(phonesOpen || isActive('/marketplace'))}
              >
                Phones
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', phonesOpen && 'rotate-180')} aria-hidden />
              </button>
            </li>
            {quickTabs.map((c) => (
              <li key={c.href}>
                <Link href={c.href} aria-current={isActive(c.href) ? 'page' : undefined} className={tabClass(isActive(c.href))}>{c.label}</Link>
              </li>
            ))}
            <li aria-hidden className="mx-2 h-5 w-px shrink-0 bg-ink/10" />
            {services.filter((c) => !(c.href === '/listings/new' && user && canSell(user.role))).map((c) => (
              <li key={c.href}>
                <Link href={c.href} aria-current={isActive(c.href) ? 'page' : undefined} className={tabClass(isActive(c.href))}>{c.label}</Link>
              </li>
            ))}
            <li>
              <PtaStatusLink className={tabClass(false)} />
            </li>
          </ul>

          {phonesOpen && (
            <div
              id="phones-menu"
              ref={phonesPanel}
              onMouseEnter={() => clearTimeout(hoverTimer.current)}
              className="absolute inset-x-0 top-full z-40 border-b border-ink/10 bg-white shadow-overlay"
              data-testid="phones-menu"
            >
              <div className="page-container grid grid-cols-4 gap-8 py-6">
                {PHONE_MENU.map((group) => (
                  <div key={group.title}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{group.title}</p>
                    <ul className="mt-3 space-y-1">
                      {group.links.map((l) => (
                        <li key={l.href}>
                          <Link href={l.href} onClick={() => setPhonesOpen(false)} className="-mx-2 block rounded-lg px-2 py-1.5 text-sm font-medium text-ink hover:bg-ink/5">{l.label}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <Link href="/shops" onClick={() => setPhonesOpen(false)} className="group flex flex-col justify-between gap-4 rounded-3xl bg-lime-300 p-5 text-ink transition hover:-translate-y-0.5">
                  <ShieldCheck className="h-6 w-6" aria-hidden />
                  <span>
                    <span className="block font-semibold">Found a phone you like?</span>
                    <span className="mt-1 block text-sm text-ink/75">Get it inspected at a verified shop before you pay.</span>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold">Find a shop <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden /></span>
                  </span>
                </Link>
              </div>
            </div>
          )}
        </nav>

        {mobileOpen && (
          <div id="mobile-nav" className="max-h-[calc(100vh-6rem)] overflow-y-auto border-t border-ink/10 bg-white md:hidden">
            <nav aria-label="Mobile" className="page-container space-y-1 py-4">
              <SearchPill className="mb-3" />
              {PHONE_MENU.map((group) => (
                <div key={group.title} className="pb-2">
                  <p className="px-1 pb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">{group.title}</p>
                  <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                    {group.links.map((c) => (
                      <Link key={c.href} href={c.href} className="shrink-0 rounded-full bg-ink/5 px-3 py-1.5 text-sm font-medium text-ink">{c.label}</Link>
                    ))}
                  </div>
                </div>
              ))}
              {primaryNav.map((item) => (
                <Link key={item.href} href={item.href} className={cn('block rounded-xl px-3 py-2.5 text-base font-semibold', isActive(item.href) ? 'bg-lime-200 text-ink' : 'text-ink hover:bg-ink/5')}>
                  {item.label}
                </Link>
              ))}
              <PtaStatusLink className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-base font-semibold text-ink hover:bg-ink/5" />
              {user && (
                <>
                  <div className="my-2 border-t border-slate-100" />
                  <div className="flex items-center gap-3 px-3 py-2">
                    <Avatar name={name} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{name}</p>
                      <p className="truncate text-xs text-slate-600">{ROLE_LABEL[user.role]}</p>
                    </div>
                  </div>
                  {dashboardNav(user.role).map((item) => (
                    <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-base text-slate-700 hover:bg-ink/5">
                      <item.icon className="h-4 w-4 text-slate-400" />
                      {item.label}
                    </Link>
                  ))}
                </>
              )}
              <div className="grid grid-cols-2 gap-2 pt-3">
                {status === 'loading' ? null : user ? (
                  <>
                    {canSell(user.role) && <LinkButton href="/listings/new" variant="accent">Sell a phone</LinkButton>}
                    <Button variant="secondary" onClick={logout} className={canSell(user.role) ? '' : 'col-span-2'}>Log out</Button>
                  </>
                ) : (
                  <>
                    <LinkButton href="/auth/login" variant="secondary">Log in</LinkButton>
                    <LinkButton href="/auth/register" variant="primary">Sign up</LinkButton>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
