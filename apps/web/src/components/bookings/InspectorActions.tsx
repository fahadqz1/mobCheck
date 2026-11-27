import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import type { BookingView } from '@/lib/booking-page';
import { Alert, Badge } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError } from '@/lib/client';
import { CHECK_RESULT } from '@/lib/format';
import { cn } from '@/lib/cn';
import { ActionCard, useBookingAction } from './BookingDetail';

type Draft = Record<string, { result: string; inspectorNotes: string }>;
const RESULTS = ['PASS', 'FAIL', 'NEEDS_ATTENTION', 'NOT_TESTED', 'NOT_VERIFIABLE', 'NOT_APPLICABLE'];
const ANNOTATIONS = [
  ['', 'General photo'],
  ['SCREEN_CRACK', 'Screen crack'],
  ['BACK_GLASS_CRACK', 'Back glass crack'],
  ['FRAME_DENT', 'Frame dent'],
  ['CAMERA_DAMAGE', 'Camera damage'],
  ['CHARGING_PORT', 'Charging port'],
  ['BUTTON_ISSUE', 'Button issue'],
  ['DISPLAY_LINE', 'Display line'],
  ['OTHER', 'Other damage'],
];

export function InspectorActions({ booking }: { booking: BookingView }) {
  const toast = useToast();
  const router = useRouter();
  const { run, pending, error } = useBookingAction(booking.id);

  if (booking.status === 'INSPECTOR_ASSIGNED') {
    return (
      <ActionCard title="Ready to inspect">
        <p className="text-slate-600">Start when the customer and the phone are with you. The customer is notified.</p>
        {error && <Alert tone="danger" title={error} />}
        <Button className="w-full" size="lg" loading={pending === 'start'} onClick={async () => { if (await run('start')) toast('success', 'Inspection started'); }}>Start inspection</Button>
      </ActionCard>
    );
  }
  if (booking.status === 'INSPECTION_IN_PROGRESS') {
    return (
      <ActionCard title="Inspection in progress">
        <p className="text-slate-600">Complete every checklist item and upload photos below, then submit.</p>
        <Button variant="outline" className="w-full" onClick={() => document.getElementById('checklist')?.scrollIntoView({ behavior: 'smooth' })}>Go to checklist</Button>
      </ActionCard>
    );
  }
  if (booking.status === 'INSPECTION_SUBMITTED') {
    return (
      <ActionCard title="Generate the report">
        <p className="text-slate-600">This issues a verifiable report to the customer and starts their review window.</p>
        {error && <Alert tone="danger" title={error} />}
        <Button className="w-full" size="lg" loading={pending === 'generate_report'} onClick={async () => { if (await run('generate_report')) toast('success', 'Report sent to the customer'); }}>Generate report</Button>
      </ActionCard>
    );
  }
  if (booking.report) {
    return (
      <ActionCard title="Report issued">
        <p className="text-slate-600">Report {booking.report.reportNumber} was sent to the customer.</p>
        <Button variant="outline" className="w-full" onClick={() => router.push('/inspector')}>Back to my inspections</Button>
      </ActionCard>
    );
  }
  return null;
}

export function InspectionWorkspace({ booking }: { booking: BookingView }) {
  const toast = useToast();
  const draftKey = `mobcheck:inspection:${booking.id}`;
  const { run, pending, error } = useBookingAction(booking.id);
  const [draft, setDraft] = useState<Draft>({});
  const [photos, setPhotos] = useState<{ id: string; url: string; annotationType: string | null; annotationText: string | null }[]>(booking.evidence);
  const [annotation, setAnnotation] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) setDraft(JSON.parse(saved));
    } catch {
      // draft unavailable
    }
  }, [draftKey]);
  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(draft));
    } catch {
      // storage unavailable
    }
  }, [draft, draftKey]);

  const categories = useMemo(() => {
    const map = new Map<string, BookingView['checklist']>();
    booking.checklist.forEach((c) => map.set(c.category, [...(map.get(c.category) || []), c]));
    return Array.from(map.entries());
  }, [booking.checklist]);
  const done = booking.checklist.filter((c) => draft[c.id]?.result).length;

  const upload = async (file: File) => {
    setUploading(true);
    setPhotoError('');
    const form = new FormData();
    form.append('file', file);
    if (annotation) form.append('annotationType', annotation);
    if (caption) form.append('annotationText', caption);
    try {
      const { data } = await api<{ data: { id: string; url: string; annotationType: string | null; annotationText: string | null } }>(`/api/bookings/${booking.id}/evidence`, { formData: form });
      setPhotos((p) => [...p, data]);
      setCaption('');
    } catch (err) {
      setPhotoError((err as ApiError).message);
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api(`/api/bookings/${booking.id}/evidence?evidenceId=${id}`, { method: 'DELETE' });
      setPhotos((p) => p.filter((x) => x.id !== id));
    } catch (err) {
      setPhotoError((err as ApiError).message);
    }
  };

  const submit = async () => {
    const results = booking.checklist.map((c) => ({ checklistId: c.id, result: draft[c.id]?.result, inspectorNotes: draft[c.id]?.inspectorNotes || undefined }));
    if (await run('submit', { results })) {
      try {
        localStorage.removeItem(draftKey);
      } catch {
        // storage unavailable
      }
      toast('success', 'Inspection submitted');
    }
  };

  if (booking.checklist.length === 0) {
    return <Alert tone="danger" title="No checklist is configured for this device type">Contact MobCheck support before continuing.</Alert>;
  }

  return (
    <div className="space-y-6" id="checklist">
      <Card as="section">
        <CardHeader title="Checklist" description={`${done} of ${booking.checklist.length} items recorded`} action={<Badge tone={done === booking.checklist.length ? 'success' : 'warning'}>{Math.round((done / booking.checklist.length) * 100)}%</Badge>} />
        <div className="divide-y divide-slate-100">
          {categories.map(([category, items]) => (
            <fieldset key={category} className="px-5 py-4">
              <legend className="text-sm font-semibold">{category}</legend>
              <ul className="mt-3 space-y-4">
                {items.map((item) => {
                  const value = draft[item.id] || { result: '', inspectorNotes: '' };
                  return (
                    <li key={item.id} className="grid gap-2 sm:grid-cols-[1fr_200px] sm:items-start">
                      <div>
                        <p className="text-sm font-medium">{item.checkName}</p>
                        {item.testInstructions && <p className="text-xs text-slate-500">{item.testInstructions}</p>}
                        <Input
                          aria-label={`Notes for ${item.checkName}`}
                          placeholder="Notes (optional)"
                          className="mt-2 h-9"
                          value={value.inspectorNotes}
                          onChange={(e) => setDraft((d) => ({ ...d, [item.id]: { ...value, inspectorNotes: e.target.value } }))}
                        />
                      </div>
                      <Select
                        aria-label={`Result for ${item.checkName}`}
                        value={value.result}
                        onChange={(e) => setDraft((d) => ({ ...d, [item.id]: { ...value, result: e.target.value } }))}
                        className={cn(!value.result && 'border-amber-300')}
                      >
                        <option value="">Select result</option>
                        {RESULTS.map((r) => <option key={r} value={r}>{CHECK_RESULT[r].label}</option>)}
                      </Select>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          ))}
        </div>
      </Card>

      <Card as="section">
        <CardHeader title="Photo evidence" description="Photograph all sides and every defect you record. At least one photo is required." />
        <CardBody className="space-y-4">
          {photoError && <Alert tone="danger" title={photoError} />}
          <div className="grid gap-3 sm:grid-cols-[200px_1fr_auto] sm:items-end">
            <Select aria-label="Photo type" value={annotation} onChange={(e) => setAnnotation(e.target.value)}>
              {ANNOTATIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
            <Input aria-label="Photo caption" placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={300} />
            <Button variant="outline" onClick={() => fileInput.current?.click()} loading={uploading}><Camera className="h-4 w-4" aria-hidden />Add photo</Button>
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" aria-label="Upload evidence photo" data-testid="evidence-input" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload(f); }} />
          </div>
          {photos.length > 0 ? (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {photos.map((p, i) => (
                <li key={p.id} className="relative overflow-hidden rounded-lg border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.annotationText || `Evidence ${i + 1}`} className="aspect-square w-full object-cover" />
                  <p className="truncate px-2 py-1 text-xs text-slate-600">{ANNOTATIONS.find(([v]) => v === p.annotationType)?.[1] || 'General'}{p.annotationText ? ` · ${p.annotationText}` : ''}</p>
                  <button type="button" onClick={() => remove(p.id)} className="absolute right-1.5 top-1.5 rounded-md bg-white/90 p-1.5 text-red-600 shadow" aria-label={`Remove photo ${i + 1}`}><Trash2 className="h-3.5 w-3.5" /></button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">{uploading ? <Loader2 className="inline h-4 w-4 animate-spin" /> : 'No photos yet.'}</p>
          )}
        </CardBody>
      </Card>

      <div className="flex flex-col items-end gap-2">
        {error && <Alert tone="danger" title={error} className="w-full" />}
        <Button size="lg" loading={pending === 'submit'} onClick={submit} disabled={done < booking.checklist.length || photos.length === 0}>Submit inspection</Button>
        {(done < booking.checklist.length || photos.length === 0) && <p className="text-sm text-slate-500">Record every item and add at least one photo to submit.</p>}
      </div>
    </div>
  );
}
