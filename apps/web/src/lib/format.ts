export const formatPKR = (value: number | string | null | undefined) =>
  value === null || value === undefined || value === '' ? '—' : `Rs ${Math.round(Number(value)).toLocaleString('en-PK')}`;

export const formatDate = (value: string | Date | null | undefined, withTime = false) => {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
};

export const timeAgo = (value: string | Date) => {
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  if (diff < 60) return 'just now';
  const units: [number, string][] = [
    [60, 'minute'],
    [3600, 'hour'],
    [86400, 'day'],
    [604800, 'week'],
    [2592000, 'month'],
    [31536000, 'year'],
  ];
  let label = '';
  for (let i = units.length - 1; i >= 0; i--) {
    const [secs, name] = units[i];
    if (diff >= secs) {
      const n = Math.floor(diff / secs);
      label = `${n} ${name}${n === 1 ? '' : 's'} ago`;
      break;
    }
  }
  return label;
};

export const CONDITION_LABEL: Record<string, string> = {
  BRAND_NEW: 'Brand new',
  LIKE_NEW: 'Like new',
  EXCELLENT: 'Excellent',
  GOOD: 'Good',
  FAIR: 'Fair',
  FOR_PARTS: 'For parts',
};

export const PTA_LABEL: Record<string, string> = {
  APPROVED: 'PTA approved',
  NON_PTA: 'Non-PTA',
  UNKNOWN: 'PTA not stated',
  BLOCKED: 'PTA blocked',
  NOT_VERIFIED: 'PTA not verified',
};

export const PTA_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  APPROVED: 'success',
  NON_PTA: 'warning',
  BLOCKED: 'danger',
  UNKNOWN: 'neutral',
  NOT_VERIFIED: 'neutral',
};

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
export const BOOKING_STATUS: Record<string, { label: string; tone: Tone }> = {
  AWAITING_PAYMENT: { label: 'Awaiting payment', tone: 'warning' },
  PAYMENT_CONFIRMED: { label: 'Paid', tone: 'info' },
  AWAITING_SHOP_CONFIRMATION: { label: 'Awaiting shop', tone: 'info' },
  BOOKING_ACCEPTED: { label: 'Accepted', tone: 'brand' },
  INSPECTOR_ASSIGNED: { label: 'Inspector assigned', tone: 'brand' },
  INSPECTION_IN_PROGRESS: { label: 'Inspection in progress', tone: 'brand' },
  INSPECTION_SUBMITTED: { label: 'Inspection submitted', tone: 'brand' },
  REPORT_UNDER_REVIEW: { label: 'Report under review', tone: 'brand' },
  REPORT_DELIVERED: { label: 'Report ready', tone: 'success' },
  REVIEW_WINDOW_OPEN: { label: 'Report ready', tone: 'success' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
  REFUND_PENDING: { label: 'Refund pending', tone: 'warning' },
  REFUNDED: { label: 'Refunded', tone: 'neutral' },
  DISPUTE_RAISED: { label: 'Dispute raised', tone: 'danger' },
};

export const SHOP_STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: 'Pending verification', tone: 'warning' },
  VERIFIED: { label: 'Verified', tone: 'success' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
  SUSPENDED: { label: 'Suspended', tone: 'danger' },
  BLOCKED: { label: 'Blocked', tone: 'danger' },
};

export const ASSESSMENT: Record<string, { label: string; tone: Tone }> = {
  EXCELLENT: { label: 'Excellent', tone: 'success' },
  GOOD: { label: 'Good', tone: 'success' },
  FAIR: { label: 'Fair', tone: 'warning' },
  NEEDS_ATTENTION: { label: 'Needs attention', tone: 'warning' },
  CRITICAL_ISSUES: { label: 'Critical issues', tone: 'danger' },
};

export const CHECK_RESULT: Record<string, { label: string; tone: Tone }> = {
  PASS: { label: 'Pass', tone: 'success' },
  FAIL: { label: 'Fail', tone: 'danger' },
  NEEDS_ATTENTION: { label: 'Needs attention', tone: 'warning' },
  NOT_TESTED: { label: 'Not tested', tone: 'neutral' },
  NOT_VERIFIABLE: { label: 'Not verifiable', tone: 'neutral' },
  NOT_APPLICABLE: { label: 'N/A', tone: 'neutral' },
};

export const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar'];

export const whatsappLink = (phone: string, text: string) => {
  const digits = phone.replace(/\D/g, '').replace(/^0/, '92');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
};

export const fileUrl = (key: string | null | undefined) => (key ? `/api/files/${key}` : null);
export const listingRef = (id: string) => `MC-L-${id.slice(-8).toUpperCase()}`;
export const bookingRef = (id: string) => `MC-B-${id.slice(-8).toUpperCase()}`;

export const fullName =(u: { firstName?: string | null; lastName?: string | null } | null | undefined) =>
  [u?.firstName, u?.lastName].filter(Boolean).join(' ') || 'MobCheck user';
