import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Field, Select, Textarea } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError } from '@/lib/client';

const CATEGORIES = [
  ['POOR_QUALITY', 'Poor service or inspection quality'],
  ['INCORRECT_REPORT', 'Inspection report was wrong'],
  ['MISLEADING_INFO', 'Misleading prices or information'],
  ['FRAUDULENT', 'Fraud or scam'],
  ['PAYMENT_ISSUE', 'Payment problem'],
  ['CANCELLATION', 'Shop cancelled or did not show up'],
  ['HARASSMENT', 'Rude or abusive behaviour'],
  ['FAKE_REVIEWS', 'Fake reviews'],
  ['OTHER', 'Something else'],
];

export function ComplaintModal({ open, onClose, shopId, shopName, bookingId }: { open: boolean; onClose: () => void; shopId: string; shopName: string; bookingId?: string }) {
  const toast = useToast();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    setFields({});
    setError('');
    try {
      await api('/api/complaints', { body: { shopId, bookingId, category, description } });
      toast('success', 'Complaint submitted. Our team will contact you within 48 hours.');
      setCategory('');
      setDescription('');
      onClose();
    } catch (err) {
      setFields((err as ApiError).fields || {});
      if (!(err as ApiError).fields) setError((err as ApiError).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose} title={`Report a problem with ${shopName}`} description="MobCheck staff review every complaint and contact you by email." footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant="danger" onClick={submit} loading={saving}>Submit complaint</Button></>}>
      <div className="space-y-4">
        {error && <Alert tone="danger" title={error} />}
        <Field label="What went wrong?" error={fields.category} required>
          {(p) => (
            <Select {...p} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Choose a category</option>
              {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Details" error={fields.description} hint="Dates, amounts and booking references help us act quickly." required>
          {(p) => <Textarea {...p} rows={5} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />}
        </Field>
      </div>
    </Modal>
  );
}
