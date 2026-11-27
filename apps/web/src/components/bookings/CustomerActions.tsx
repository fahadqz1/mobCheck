import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { BookingView } from '@/lib/booking-page';
import { Alert } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Checkbox, Field, Textarea } from '@/components/ui/Form';
import { StarInput } from '@/components/ui/Rating';
import { useToast } from '@/components/ui/Toast';
import { formatPKR } from '@/lib/format';
import { ActionCard, useBookingAction } from './BookingDetail';

function useCountdown(until: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, [until]);
  if (!until) return null;
  const ms = new Date(until).getTime() - now;
  if (ms <= 0) return 'less than a minute';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m} minutes`;
}

export function CustomerActions({ booking }: { booking: BookingView }) {
  const router = useRouter();
  const toast = useToast();
  const { run, pending, error, fields } = useBookingAction(booking.id);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [review, setReview] = useState({ overallRating: 0, reviewText: '', wouldRecommend: true });
  const remaining = useCountdown(booking.status === 'REPORT_DELIVERED' ? booking.reviewWindowExpiresAt : null);

  switch (booking.status) {
    case 'AWAITING_PAYMENT':
      return (
        <ActionCard title="Complete your booking">
          <p className="text-slate-600">Pay the inspection fee to send this booking to the shop.</p>
          {error && <Alert tone="danger" title={error} />}
          <Button className="w-full" size="lg" loading={pending === 'pay'} onClick={() => run('pay', {}, (d) => router.push(d.checkoutUrl))}>Pay {formatPKR(booking.fee)}</Button>
          <Button variant="ghost" className="w-full" onClick={() => setConfirmCancel(true)}>Cancel booking</Button>
          <CancelModal open={confirmCancel} onClose={() => setConfirmCancel(false)} refund={false} loading={pending === 'cancel'} onConfirm={async () => { if (await run('cancel')) { setConfirmCancel(false); toast('success', 'Booking cancelled'); } }} />
        </ActionCard>
      );
    case 'AWAITING_SHOP_CONFIRMATION':
    case 'PAYMENT_CONFIRMED':
      return (
        <ActionCard title="Waiting for the shop">
          <p className="text-slate-600">{booking.shop.name} will confirm your appointment shortly. You can still cancel for a full refund until they accept.</p>
          {error && <Alert tone="danger" title={error} />}
          <Button variant="outline" className="w-full" onClick={() => setConfirmCancel(true)}>Cancel and refund</Button>
          <CancelModal open={confirmCancel} onClose={() => setConfirmCancel(false)} refund loading={pending === 'cancel'} onConfirm={async () => { if (await run('cancel')) { setConfirmCancel(false); toast('success', 'Booking cancelled. Your refund is being processed.'); } }} />
        </ActionCard>
      );
    case 'BOOKING_ACCEPTED':
    case 'INSPECTOR_ASSIGNED':
      return (
        <ActionCard title="You're booked in">
          <p className="text-slate-600">Bring the phone to {booking.shop.name} at the booked time. If you are inspecting someone else&apos;s phone, ask the seller to come with you.</p>
        </ActionCard>
      );
    case 'INSPECTION_IN_PROGRESS':
    case 'INSPECTION_SUBMITTED':
      return (
        <ActionCard title="Inspection underway">
          <p className="text-slate-600">The inspector is checking the phone. You&apos;ll be notified as soon as the report is ready.</p>
        </ActionCard>
      );
    case 'REPORT_DELIVERED':
      return (
        <ActionCard title="Review your report">
          <p className="text-slate-600">If the report looks right, confirm it. If something is wrong, raise a dispute within <strong>{remaining}</strong>. After that the report is confirmed automatically.</p>
          {error && !disputeOpen && <Alert tone="danger" title={error} />}
          <Button className="w-full" loading={pending === 'confirm'} onClick={async () => { if (await run('confirm')) toast('success', 'Thanks for confirming'); }}>Confirm report</Button>
          <Button variant="outline" className="w-full" onClick={() => setDisputeOpen(true)}>Raise a dispute</Button>
          <Modal
            open={disputeOpen}
            onClose={() => setDisputeOpen(false)}
            title="Raise a dispute"
            description="MobCheck will review the report and photos, usually within 48 hours. The shop's payout is held meanwhile."
            footer={<><Button variant="outline" onClick={() => setDisputeOpen(false)}>Cancel</Button><Button variant="danger" loading={pending === 'dispute'} onClick={async () => { if (await run('dispute', { reason })) { setDisputeOpen(false); toast('success', 'Dispute submitted'); } }}>Submit dispute</Button></>}
          >
            {error && !fields.reason && <Alert tone="danger" title={error} className="mb-4" />}
            <Field label="What is wrong with the report?" error={fields.reason} required>{(p) => <Textarea {...p} rows={5} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />}</Field>
          </Modal>
        </ActionCard>
      );
    case 'COMPLETED':
      if (booking.review) return <ActionCard title="Inspection completed"><p className="text-slate-600">Thanks for your review.</p></ActionCard>;
      return (
        <ActionCard title="Rate this shop">
          <p className="text-slate-600">Your review helps other buyers choose a shop. It is published with your first name.</p>
          {error && <Alert tone="danger" title={error} />}
          <div>
            <StarInput label="Overall rating" value={review.overallRating} onChange={(v) => setReview({ ...review, overallRating: v })} />
            {fields.overallRating && <p className="text-sm text-red-600">Choose a rating</p>}
          </div>
          <Field label="Your review" error={fields.reviewText}>{(p) => <Textarea {...p} rows={3} value={review.reviewText} onChange={(e) => setReview({ ...review, reviewText: e.target.value })} maxLength={1000} />}</Field>
          <Checkbox label="I would recommend this shop" checked={review.wouldRecommend} onChange={(e) => setReview({ ...review, wouldRecommend: e.target.checked })} />
          <Button className="w-full" loading={pending === 'review'} onClick={async () => { if (await run('review', { ...review, reviewText: review.reviewText || undefined })) toast('success', 'Review published'); }}>Publish review</Button>
        </ActionCard>
      );
    default:
      return null;
  }
}

function CancelModal({ open, onClose, onConfirm, loading, refund }: { open: boolean; onClose: () => void; onConfirm: () => void; loading: boolean; refund: boolean }) {
  return (
    <Modal open={open} onClose={onClose} size="sm" title="Cancel this booking?" description={refund ? 'Your payment will be refunded in full to the original method.' : 'Nothing has been charged.'} footer={<><Button variant="outline" onClick={onClose}>Keep booking</Button><Button variant="danger" loading={loading} onClick={onConfirm}>Cancel booking</Button></>}>
      <p className="text-sm text-slate-600">This can&apos;t be undone. You can book again at any time.</p>
    </Modal>
  );
}
