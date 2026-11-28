import Link from 'next/link';
import { ArrowUpRight, Camera, ClipboardCheck, LockKeyhole, MessageCircle, MessagesSquare, Sparkles, Store } from 'lucide-react';
import { PTA_STATUS_URL, SUPPORT_WHATSAPP_DISPLAY, supportWhatsappLink } from '@/lib/help-content';
import { Logo } from './Logo';

type FooterLink = { href: string; label: string; external?: boolean };

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: 'About',
    links: [
      { href: '/about', label: 'About MobCheck' },
      { href: '/about#how-it-works', label: 'How inspections work' },
      { href: '/shops', label: 'Verified inspection shops' },
      { href: '/verify', label: 'Verify a report' },
    ],
  },
  {
    title: 'Help',
    links: [
      { href: '/help', label: 'Help centre' },
      { href: supportWhatsappLink({ page: 'Footer' }), label: 'WhatsApp support', external: true },
      { href: '/refunds', label: 'Refunds and cancellations' },
      { href: '/help#safety', label: 'Buying safely' },
    ],
  },
  {
    title: 'Services',
    links: [
      { href: '/marketplace', label: 'Buy a used phone' },
      { href: '/listings/new', label: 'Sell your phone' },
      { href: '/shops', label: 'Book an inspection' },
      { href: '/saved', label: 'Saved phones' },
      { href: PTA_STATUS_URL, label: 'PTA Status', external: true },
    ],
  },
  {
    title: 'For shops',
    links: [
      { href: '/auth/register?role=SHOP_OWNER', label: 'Register your shop' },
      { href: '/dashboard', label: 'Shop dashboard' },
      { href: '/help#shop', label: 'Plans and fees' },
    ],
  },
];

const promises = [
  { icon: Store, text: 'Shops verified by MobCheck' },
  { icon: ClipboardCheck, text: 'Reports you can verify' },
  { icon: MessagesSquare, text: 'Private, protected chat' },
  { icon: Camera, text: 'Watermarked phone photos' },
  { icon: LockKeyhole, text: 'Secure online checkout' },
];

const legal = [
  { href: '/terms', label: 'Terms of use' },
  { href: '/privacy', label: 'Privacy policy' },
  { href: '/refunds', label: 'Refund policy' },
];

function FooterAnchor({ link, className }: { link: FooterLink; className: string }) {
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={`relative ${className}`}>
        {link.label}
        <ArrowUpRight className="ml-0.5 inline h-3.5 w-3.5 align-[-2px]" aria-hidden />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return <Link href={link.href} className={className}>{link.label}</Link>;
}

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-ink/10 bg-white" data-testid="site-footer">
      {/* Trust strip */}
      <div className="border-b border-ink/5 bg-[#f6f7f4]">
        <ul className="page-container grid grid-cols-2 gap-x-4 gap-y-3 py-5 sm:grid-cols-3 lg:grid-cols-5">
          {promises.map((p) => (
            <li key={p.text} className="flex items-center gap-2.5 text-sm font-medium text-ink">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime-300"><p.icon className="h-4 w-4" aria-hidden /></span>
              {p.text}
            </li>
          ))}
        </ul>
      </div>

      <div className="page-container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-slate-600">
            Pakistan&apos;s marketplace for used phones with independent, professional inspections by verified shops.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href={supportWhatsappLink({ page: 'Footer' })} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#157a3f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#106533]">
              <MessageCircle className="h-4 w-4" aria-hidden />WhatsApp {SUPPORT_WHATSAPP_DISPLAY}
            </a>
          </div>
          <p className="mt-3 text-xs text-slate-600"><Sparkles className="mr-1 inline h-3.5 w-3.5 align-[-2px]" aria-hidden />Or tap <strong className="font-semibold text-ink">Help</strong> for instant answers, any time.</p>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-sm font-semibold text-ink">{col.title}</h2>
            <ul className="mt-3 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <FooterAnchor link={l} className="text-sm text-slate-600 transition-colors hover:text-ink" />
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-ink/10">
        <div className="page-container flex flex-col gap-3 py-5 text-xs text-slate-600 md:flex-row md:items-center md:justify-between">
          <p>© {year} MobCheck. All rights reserved.</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {legal.map((l) => (
              <li key={l.href}><Link href={l.href} className="hover:text-ink">{l.label}</Link></li>
            ))}
          </ul>
        </div>
        <p className="page-container pb-6 text-xs leading-5 text-slate-600">
          MobCheck is an independent online marketplace operating in Pakistan. &ldquo;PTA Status&rdquo; opens the official Pakistan Telecommunication Authority
          DIRBS website; MobCheck is not affiliated with or endorsed by PTA. Phone brand names belong to their respective owners.
        </p>
      </div>
    </footer>
  );
}
