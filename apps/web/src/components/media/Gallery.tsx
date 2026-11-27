import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Expand, ImageOff, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export type GalleryImage = { id: string; url: string; alt: string };

export function Gallery({ images, emptyLabel = 'No photos uploaded yet' }: { images: GalleryImage[]; emptyLabel?: string }) {
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const count = images.length;
  const go = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [fullscreen, go]);

  if (count === 0) {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-[#f1f2ee] text-slate-600" data-testid="gallery-empty">
        <ImageOff className="h-8 w-8 text-slate-400" aria-hidden />
        <p className="text-sm">{emptyLabel}</p>
      </div>
    );
  }

  const current = images[index];
  return (
    <div data-testid="gallery">
      <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-slate-200 bg-[#f1f2ee]">
        <Image src={current.url} alt={current.alt} fill sizes="(min-width: 1024px) 640px, 100vw" className="object-contain" priority={index === 0} />
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="absolute right-3 top-3 inline-flex h-9 items-center gap-1.5 glass rounded-full px-3 text-sm font-semibold text-ink hover:bg-white"
          aria-label="View photos full screen"
        >
          <Expand className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Full screen</span>
        </button>
        {count > 1 && (
          <>
            <NavButton side="left" onClick={() => go(-1)} />
            <NavButton side="right" onClick={() => go(1)} />
            <span className="absolute bottom-3 left-3 rounded-md bg-slate-900/70 px-2 py-0.5 text-xs font-medium text-white" aria-live="polite">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>
      {count > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Photo thumbnails">
          {images.map((img, i) => (
            <li key={img.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                className={cn('relative block aspect-square w-16 overflow-hidden rounded-2xl border-2 bg-slate-100 sm:w-20', i === index ? 'border-ink' : 'border-transparent opacity-70 hover:opacity-100')}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {fullscreen &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex flex-col bg-slate-950" role="dialog" aria-modal="true" aria-label="Photo viewer">
            <div className="flex items-center justify-between px-4 py-3 text-white">
              <span className="text-sm">{index + 1} / {count}</span>
              <button type="button" onClick={() => setFullscreen(false)} className="rounded-lg p-2 hover:bg-white/10" aria-label="Close photo viewer" autoFocus>
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="relative flex-1">
              <Image src={current.url} alt={current.alt} fill sizes="100vw" className="object-contain" />
              {count > 1 && (
                <>
                  <NavButton side="left" onClick={() => go(-1)} dark />
                  <NavButton side="right" onClick={() => go(1)} dark />
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

function NavButton({ side, onClick, dark }: { side: 'left' | 'right'; onClick: () => void; dark?: boolean }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Previous photo' : 'Next photo'}
      className={cn(
        'absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full shadow-card',
        side === 'left' ? 'left-3' : 'right-3',
        dark ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-white/90 text-ink hover:bg-white'
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
