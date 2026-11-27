import { useState } from 'react';
import Link from 'next/link';
import type { BookingView } from '@/lib/booking-page';
import { Alert } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Field, Select, Textarea } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { ActionCard, useBookingAction } from './BookingDetail';

export function ShopActions({ booking }: { booking: BookingView }) {
  const toast = useToast();
  const { run, pending, error, fields } = useBookingAction(booking.id);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [inspectorId, setInspectorId] = useState(booking.inspectorId || '');

  if (booking.status === 'AWAITING_SHOP_CONFIRMATION' || booking.status === 'PAYMENT_CONFIRMED') {
    return (
      <ActionCard title="New booking request">
        <p className="text-slate-600">The customer has paid. Accept to confirm the appointment, or decline and they are refunded in full.</p>
        {error && !rejecting && <Alert tone="danger" title={error} />}
        <Button className="w-full" loading={pending === 'accept'} onClick={async () => { if (await run('accept')) toast('success', 'Booking accepted'); }}>Accept booking</Button>
        <Button variant="outline" className="w-full" onClick={() => setRejecting(true)}>Decline</Button>
        <Modal open={rejecting} onClose={() => setRejecting(false)} title="Decline this booking?" description="The customer gets a full refund and sees your reason." footer={<><Button variant="outline" onClick={() => setRejecting(false)}>Cancel</Button><Button variant="danger" loading={pending === 'reject'} onClick={async () => { if (await run('reject', { reason })) { setRejecting(false); toast('success', 'Booking declined'); } }}>Decline booking</Button></>}>
          <Field label="Reason" error={fields.reason} required>{(p) => <Textarea {...p} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Fully booked at that time. Please choose another slot." />}</Field>
        </Modal>
      </ActionCard>
    );
  }
  if (booking.status === 'BOOKING_ACCEPTED' || booking.status === 'INSPECTOR_ASSIGNED') {
    return (
      <ActionCard title={booking.status === 'BOOKING_ACCEPTED' ? 'Assign an inspector' : 'Inspector assigned'}>
        {booking.inspectors.length === 0 ? (
          <Alert tone="warning" title="No active inspectors">Add one on the <Link href="/vendor/inspectors" className="underline">Inspectors</Link> page first.</Alert>
        ) : (
          <>
            {error && <Alert tone="danger" title={error} />}
            <Field label="Inspector" error={fields.inspectorId}>
              {(p) => (
                <Select {...p} value={inspectorId} onChange={(e) => setInspectorId(e.target.value)}>
                  <option value="">Choose inspector</option>
                  {booking.inspectors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </Select>
              )}
            </Field>
            <Button className="w-full" loading={pending === 'assign'} disabled={!inspectorId || inspectorId === booking.inspectorId} onClick={async () => { if (await run('assign', { inspectorId })) toast('success', 'Inspector assigned'); }}>
              {booking.inspectorId ? 'Reassign' : 'Assign inspector'}
            </Button>
          </>
        )}
      </ActionCard>
    );
  }
  const notes: Record<string, string> = {
    AWAITING_PAYMENT: 'The customer has not paid yet. Unpaid bookings are not confirmed.',
    INSPECTION_IN_PROGRESS: 'Your inspector is working on this device.',
    INSPECTION_SUBMITTED: 'Waiting for the inspector to generate the report.',
    REPORT_DELIVERED: 'The customer is reviewing the report. The payout becomes eligible once they confirm or the review window ends.',
    DISPUTE_RAISED: 'The customer disputed the report. MobCheck will review it and contact you if needed.',
    COMPLETED: 'This inspection is complete.',
  };
  return notes[booking.status] ? <ActionCard title="Status"><p className="text-slate-600">{notes[booking.status]}</p></ActionCard> : null;
}
