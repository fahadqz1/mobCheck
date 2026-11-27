import Link from 'next/link';

export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x="7" y="2" width="18" height="28" rx="4.5" className="fill-ink" />
      <rect x="10" y="5.5" width="12" height="19" rx="1.5" className="fill-lime-300" />
      <path d="M12.6 15.4l2.4 2.4 4.6-4.8" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="stroke-ink" />
      <rect x="14" y="26.4" width="4" height="1.4" rx=".7" className="fill-white/80" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2 rounded-md" aria-label="MobCheck home">
      <LogoMark />
      <span className="font-display text-xl font-extrabold tracking-[-0.03em] text-ink">MobCheck</span>
    </Link>
  );
}
