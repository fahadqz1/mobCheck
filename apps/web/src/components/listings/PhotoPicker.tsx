import { useRef } from 'react';
import { ImagePlus, Star, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type PickedPhoto = { id: string; url: string; file?: File; isPrimary?: boolean; uploading?: boolean };

const ACCEPT = 'image/jpeg,image/png,image/webp';

export function PhotoPicker({
  photos,
  onAdd,
  onRemove,
  onMakePrimary,
  max = 10,
  error,
}: {
  photos: PickedPhoto[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  onMakePrimary?: (id: string) => void;
  max?: number;
  error?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {photos.map((p, i) => (
          <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={`Photo ${i + 1}`} className={cn('h-full w-full object-cover', p.uploading && 'opacity-50')} />
            {(p.isPrimary || (!onMakePrimary && i === 0)) && <span className="absolute left-1.5 top-1.5 rounded bg-brand-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">Cover</span>}
            <div className="absolute inset-x-1.5 bottom-1.5 flex justify-end gap-1">
              {onMakePrimary && !p.isPrimary && (
                <button type="button" onClick={() => onMakePrimary(p.id)} className="rounded-md bg-white/90 p-1.5 text-slate-700 shadow hover:bg-white" aria-label={`Make photo ${i + 1} the cover`}>
                  <Star className="h-3.5 w-3.5" />
                </button>
              )}
              <button type="button" onClick={() => onRemove(p.id)} className="rounded-md bg-white/90 p-1.5 text-red-600 shadow hover:bg-white" aria-label={`Remove photo ${i + 1}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {photos.length < max && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 bg-white text-slate-500 hover:border-brand-500 hover:text-brand-700"
          >
            <ImagePlus className="h-6 w-6" aria-hidden />
            <span className="text-xs font-medium">Add photos</span>
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        aria-label="Upload photos"
        data-testid="photo-input"
        onChange={(e) => {
          const files = Array.from(e.target.files || []).slice(0, max - photos.length);
          if (files.length) onAdd(files);
          e.target.value = '';
        }}
      />
      <p className={cn('mt-2 text-sm', error ? 'text-red-600' : 'text-slate-500')}>
        {error || `Up to ${max} photos, JPEG, PNG or WebP, 8 MB each. Show the front, back, sides and any damage.`}
      </p>
    </div>
  );
}
