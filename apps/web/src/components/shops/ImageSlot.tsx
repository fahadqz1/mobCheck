import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';

// One upload slot (logo or cover) that previews, replaces and removes a single image.
export function ImageSlot({
  label,
  url,
  onUpload,
  onRemove,
  className,
}: {
  label: string;
  url: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <p className="text-label mb-1.5">{label}</p>
      <div className={cn('group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100', className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url && <img src={url} alt={label} className="h-full w-full object-cover" />}
        {busy && <div className="absolute inset-0 flex items-center justify-center bg-white/60"><Loader2 className="h-6 w-6 animate-spin text-slate-600" /></div>}
        <div className={cn('absolute inset-0 flex items-center justify-center gap-2', url ? 'bg-slate-900/0 opacity-0 transition group-focus-within:opacity-100 group-hover:bg-slate-900/40 group-hover:opacity-100' : '')}>
          <button type="button" onClick={() => input.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium shadow">
            <ImagePlus className="h-4 w-4" aria-hidden />{url ? 'Replace' : 'Upload'}<span className="sr-only"> {label}</span>
          </button>
          {url && (
            <button type="button" onClick={() => run(onRemove)} className="inline-flex items-center rounded-lg bg-white p-1.5 text-red-600 shadow" aria-label={`Remove ${label}`}>
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label={`Upload ${label}`}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) run(() => onUpload(file));
        }}
      />
    </div>
  );
}
