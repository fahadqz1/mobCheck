// Simple vector device illustrations for category tiles. They depict device types, never specific listings.
type Props = { className?: string; tone?: string };

export function PhoneArt({ className = 'h-24', tone = '#0b1220' }: Props) {
  return (
    <svg viewBox="0 0 64 120" className={className} aria-hidden>
      <rect x="2" y="2" width="60" height="116" rx="12" fill={tone} />
      <rect x="6" y="6" width="52" height="108" rx="9" fill="url(#scr)" />
      <rect x="24" y="10" width="16" height="4" rx="2" fill={tone} />
      <defs>
        <linearGradient id="scr" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d4f064" />
          <stop offset="0.55" stopColor="#6ce3bb" />
          <stop offset="1" stopColor="#9b8cf2" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function PhoneBackArt({ className = 'h-24', tone = '#e8e2d8', lens = '#0b1220' }: Props & { lens?: string }) {
  return (
    <svg viewBox="0 0 64 120" className={className} aria-hidden>
      <rect x="2" y="2" width="60" height="116" rx="12" fill={tone} stroke="rgba(11,18,32,.12)" />
      <rect x="8" y="8" width="26" height="28" rx="8" fill="rgba(11,18,32,.08)" />
      <circle cx="16" cy="16" r="5" fill={lens} />
      <circle cx="26" cy="22" r="5" fill={lens} />
      <circle cx="16" cy="28" r="5" fill={lens} />
    </svg>
  );
}

export function FoldArt({ className = 'h-24', tone = '#1f2937' }: Props) {
  return (
    <svg viewBox="0 0 100 120" className={className} aria-hidden>
      <rect x="2" y="2" width="96" height="116" rx="10" fill={tone} />
      <rect x="6" y="6" width="43" height="108" rx="6" fill="#a6f2d5" />
      <rect x="51" y="6" width="43" height="108" rx="6" fill="#ece6fb" />
    </svg>
  );
}

export function ShopArt({ className = 'h-24' }: Props) {
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden>
      <rect x="10" y="34" width="100" height="62" rx="6" fill="#fff" stroke="#0b1220" strokeWidth="3" />
      <path d="M6 34 18 8h84l12 26z" fill="#d4f064" stroke="#0b1220" strokeWidth="3" strokeLinejoin="round" />
      <rect x="22" y="50" width="34" height="46" rx="3" fill="#0b1220" />
      <rect x="66" y="50" width="32" height="24" rx="3" fill="#a6f2d5" stroke="#0b1220" strokeWidth="3" />
    </svg>
  );
}

export function ReportArt({ className = 'h-24' }: Props) {
  return (
    <svg viewBox="0 0 96 120" className={className} aria-hidden>
      <rect x="4" y="4" width="88" height="112" rx="10" fill="#fff" stroke="#0b1220" strokeWidth="3" />
      <rect x="16" y="18" width="40" height="7" rx="3.5" fill="#0b1220" />
      {[38, 56, 74].map((y) => (
        <g key={y}>
          <circle cx="22" cy={y} r="6" fill="#d4f064" stroke="#0b1220" strokeWidth="2" />
          <path d={`M19 ${y}l2.5 2.5 4.5-5`} fill="none" stroke="#0b1220" strokeWidth="2" strokeLinecap="round" />
          <rect x="34" y={y - 3} width="44" height="6" rx="3" fill="#e2e8f0" />
        </g>
      ))}
      <rect x="58" y="88" width="24" height="18" rx="3" fill="#0b1220" />
    </svg>
  );
}
