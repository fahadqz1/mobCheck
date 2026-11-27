import Link from 'next/link';
import { Logo } from './Logo';

const columns = [
  {
    title: 'Buyers',
    links: [
      { href: '/marketplace', label: 'Browse phones' },
      { href: '/shops', label: 'Find an inspection shop' },
      { href: '/verify', label: 'Verify a report' },
    ],
  },
  {
    title: 'Sellers & shops',
    links: [
      { href: '/listings/new', label: 'Sell your phone' },
      { href: '/auth/register?role=SHOP_OWNER', label: 'List your shop' },
      { href: '/dashboard', label: 'Dashboard' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="page-container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-slate-600">
            Buy and sell used phones in Pakistan with independent, professional inspections from verified shops.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h2 className="text-sm font-semibold">{col.title}</h2>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-600 hover:text-ink">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100">
        <p className="page-container py-5 text-xs text-slate-600">© {new Date().getFullYear()} MobCheck. All rights reserved.</p>
      </div>
    </footer>
  );
}
