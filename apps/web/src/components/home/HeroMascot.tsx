import { useCallback, useEffect, useRef, useState } from 'react';
import { BatteryMedium, Camera, Check, Fingerprint, Lock, RotateCcw, ScanLine, ShieldCheck, Smartphone } from 'lucide-react';
import { cn } from '@/lib/cn';

// What a MobCheck inspection covers. Labels only: no values, so nothing here pretends to be a real result.
const CHECKS = [
  { label: 'Screen & touch', icon: Smartphone, pos: 'left-3 top-6 sm:left-6 sm:top-10' },
  { label: 'Battery health', icon: BatteryMedium, pos: 'right-3 top-14 sm:right-6 sm:top-16' },
  { label: 'Cameras', icon: Camera, pos: 'left-2 top-[44%] sm:left-4' },
  { label: 'IMEI match', icon: Fingerprint, pos: 'right-2 top-[52%] sm:right-4' },
  { label: 'PTA status', icon: ShieldCheck, pos: 'left-4 bottom-28 sm:left-8 sm:bottom-28' },
  { label: 'iCloud / FRP lock', icon: Lock, pos: 'right-4 bottom-[5.5rem] sm:right-8 sm:bottom-24' },
];

const STEP_MS = 650;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

export function HeroMascot({ checks }: { checks: number }) {
  const panel = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [revealed, setRevealed] = useState(0);
  const [run, setRun] = useState(0);

  // Reveal checks one by one, hold, then loop. Reduced motion shows everything at once.
  useEffect(() => {
    if (reduced) {
      setRevealed(CHECKS.length);
      return;
    }
    setRevealed(0);
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      if (i <= CHECKS.length) setRevealed(i);
      else if (i > CHECKS.length + 6) {
        i = 0;
        setRevealed(0);
      }
    }, STEP_MS);
    return () => clearInterval(t);
  }, [run, reduced]);

  const onMove = useCallback((e: React.PointerEvent) => {
    const r = panel.current?.getBoundingClientRect();
    if (!r) return;
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height * 0.4)) / (r.height / 2);
    setLook({ x: Math.max(-1, Math.min(1, dx)), y: Math.max(-1, Math.min(1, dy)) });
  }, []);

  const replay = () => setRun((n) => n + 1);
  const done = revealed >= CHECKS.length;
  const px = look.x * 4;
  const py = look.y * 4;

  return (
    <div
      ref={panel}
      onPointerMove={onMove}
      onPointerLeave={() => setLook({ x: 0, y: 0 })}
      className="relative min-h-[420px] overflow-hidden rounded-[32px] bg-ink lg:min-h-0"
    >
      {/* Scanner grid and colour glows */}
      <div aria-hidden className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div aria-hidden className="absolute left-1/2 top-[55%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 animate-glow rounded-full bg-lime-300/60 blur-3xl" />
      <div aria-hidden className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-[#9b8cf2]/40 blur-3xl" />
      <div aria-hidden className="absolute -bottom-12 -right-8 h-56 w-56 rounded-full bg-brand-400/40 blur-3xl" />

      {/* Check chips */}
      <ul aria-label="What every inspection checks" className="absolute inset-0">
        {CHECKS.map((c, i) => {
          const shown = i < revealed;
          return (
            <li
              key={c.label}
              className={cn('glass absolute z-10 flex items-center gap-1.5 rounded-full py-1.5 pl-1.5 pr-3 text-[11px] font-semibold text-ink sm:text-xs', c.pos, shown ? 'animate-pop' : 'opacity-0')}
            >
              <span className={cn('flex h-6 w-6 items-center justify-center rounded-full', shown ? 'bg-ink text-lime-300' : 'bg-ink/10')}>
                {shown ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> : <c.icon className="h-3.5 w-3.5" aria-hidden />}
              </span>
              {c.label}
            </li>
          );
        })}
      </ul>

      {/* Checko */}
      <button
        type="button"
        onClick={replay}
        aria-label="Checko, the MobCheck inspector. Play the inspection scan again"
        className="absolute left-1/2 top-[48%] z-0 -translate-x-1/2 -translate-y-1/2 rounded-3xl focus-visible:ring-lime-300 focus-visible:ring-offset-ink"
      >
        <svg viewBox="0 0 230 270" className="h-60 w-auto animate-float lg:h-80 drop-shadow-[0_24px_30px_rgba(0,0,0,0.45)] sm:h-72" aria-hidden>
          <defs>
            <linearGradient id="checko-screen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e2f68f" />
              <stop offset="1" stopColor="#6ce3bb" />
            </linearGradient>
            <clipPath id="checko-clip">
              <rect x="63" y="32" width="84" height="178" rx="16" />
            </clipPath>
          </defs>

          {/* legs */}
          <path d="M90 220v22M120 220v22" stroke="#d4f064" strokeWidth="8" strokeLinecap="round" />
          <ellipse cx="86" cy="246" rx="12" ry="6" fill="#d4f064" />
          <ellipse cx="124" cy="246" rx="12" ry="6" fill="#d4f064" />

          {/* waving arm */}
          <g className={reduced ? '' : 'animate-wave'} style={{ transformBox: 'fill-box', transformOrigin: '100% 100%' }}>
            <path d="M56 128c-14-6-24-18-28-34" stroke="#d4f064" strokeWidth="8" strokeLinecap="round" fill="none" />
            <circle cx="27" cy="90" r="9" fill="#d4f064" />
          </g>

          {/* body */}
          <rect x="55" y="22" width="100" height="200" rx="24" fill="#0b1220" />
          <rect x="55" y="22" width="100" height="200" rx="24" fill="none" stroke="#d4f064" strokeOpacity=".7" strokeWidth="3" />
          <rect x="63" y="32" width="84" height="178" rx="16" fill="url(#checko-screen)" />
          <rect x="93" y="38" width="24" height="6" rx="3" fill="#0b1220" />

          {/* face */}
          <g className={reduced ? '' : 'animate-blink'} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <ellipse cx="88" cy="98" rx="12" ry="14" fill="#fff" />
            <ellipse cx="122" cy="98" rx="12" ry="14" fill="#fff" />
            <g style={{ transform: `translate(${px}px, ${py}px)`, transition: 'transform 120ms ease-out' }}>
              <circle cx="88" cy="99" r="6" fill="#0b1220" />
              <circle cx="122" cy="99" r="6" fill="#0b1220" />
              <circle cx="90" cy="96" r="2" fill="#fff" />
              <circle cx="124" cy="96" r="2" fill="#fff" />
            </g>
          </g>
          <ellipse cx="76" cy="122" rx="7" ry="4" fill="#f9a8d4" opacity=".8" />
          <ellipse cx="134" cy="122" rx="7" ry="4" fill="#f9a8d4" opacity=".8" />
          <path d={done ? 'M92 122q13 16 26 0' : 'M94 124q11 8 22 0'} stroke="#0b1220" strokeWidth="4" strokeLinecap="round" fill="none" style={{ transition: 'd 300ms' }} />

          {/* scan beam */}
          {!reduced && (
            <g clipPath="url(#checko-clip)">
              <g key={run} className="animate-scan">
                <rect x="63" y="34" width="84" height="5" rx="2.5" fill="#ffffff" opacity=".95" />
                <rect x="63" y="20" width="84" height="16" fill="#ffffff" opacity=".25" />
              </g>
            </g>
          )}

          {/* arm with magnifying glass */}
          <path d="M155 132c10 4 18 12 22 22" stroke="#d4f064" strokeWidth="8" strokeLinecap="round" fill="none" />
          <line x1="196" y1="182" x2="214" y2="204" stroke="#d4f064" strokeWidth="9" strokeLinecap="round" />
          <circle cx="184" cy="168" r="20" fill="rgba(255,255,255,.3)" stroke="#d4f064" strokeWidth="7" />
          <path d="M174 160a12 12 0 0 1 10-6" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      </button>

      {/* Caption */}
      <div className="glass-dark absolute inset-x-3 bottom-3 z-20 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 sm:inset-x-4 sm:bottom-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Meet Checko, your inspector</p>
          <p className="truncate text-xs text-slate-300" aria-live="polite">
            {done ? `${checks} checks done. One report you can verify.` : `Scanning… ${revealed} of ${CHECKS.length} areas`}
          </p>
        </div>
        <button type="button" onClick={replay} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-lime-300 px-3.5 text-xs font-semibold text-ink transition hover:bg-lime-200 active:scale-[0.97]">
          {done ? <RotateCcw className="h-3.5 w-3.5" aria-hidden /> : <ScanLine className="h-3.5 w-3.5" aria-hidden />}
          {done ? 'Scan again' : 'Watch a scan'}
        </button>
      </div>
    </div>
  );
}
