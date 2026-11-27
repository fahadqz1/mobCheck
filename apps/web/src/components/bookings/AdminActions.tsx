import { useState } from 'react';
import type { BookingView } from '@/lib/booking-page';
import { Alert } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Field, Textarea } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { ActionCard, useBookingAction } from './BookingDetail';

export function AdminActions({ booking }: { booking: BookingView }) {
  const toast = useToast();
  const { run, pending, error } = useBookingAction(booking.id);
  const [note, setNote] = useState('');

  if (booking.status === 'DISPUTE_RAISED') {
    return (
      <ActionCard title="Resolve dispute">
        <p className="text-slate-600">Review the report, checklist and photos, then decide.</p>
        {error && <Alert tone="danger" title={error} />}
        <Field label="Resolution note" hint="Shared with the customer and the shop.">{(p) => <Textarea {...p} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
        <Button className="w-full" loading={pending === 'release'} onClick={async () => { if (await run('release', { note: note || undefined })) toast('success', 'Report upheld, payout released'); }}>Uphold report and release payout</Button>
        <Button variant="danger" className="w-full" loading={pending === 'refund'} onClick={async () => { if (await run('refund', { note: note || undefined })) toast('success', 'Refund issued'); }}>Refund the customer</Button>
      </ActionCard>
    );
  }
  if (booking.status === 'REFUND_PENDING') {
    return (
      <ActionCard title="Refund pending">
        <p className="text-slate-600">Mark the refund as paid once the money has been returned through the payment gateway.</p>
        {error && <Alert tone="danger" title={error} />}
        <Button className="w-full" loading={pending === 'mark_refunded'} onClick={async () => { if (await run('mark_refunded')) toast('success', 'Refund marked as paid'); }}>Mark refund as paid</Button>
      </ActionCard>
    );
  }
  if (booking.status === 'INSPECTION_SUBMITTED') {
    return (
      <ActionCard title="Report not generated">
        {error && <Alert tone="danger" title={error} />}
        <Button className="w-full" loading={pending === 'generate_report'} onClick={async () => { if (await run('generate_report')) toast('success', 'Report generated'); }}>Generate report</Button>
      </ActionCard>
    );
  }
  return null;
}
