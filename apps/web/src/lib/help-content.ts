// Single source of truth for customer help: the Help page, the FAQ assistant and the AI assistant's knowledge.

export const SUPPORT_WHATSAPP = '923174351383';
export const SUPPORT_WHATSAPP_DISPLAY = '+92 317 4351383';

// External link only: MobCheck does not query or integrate with PTA systems.
export const PTA_STATUS_URL = 'https://dirbs.pta.gov.pk/';

export function supportWhatsappLink(context?: { page?: string; question?: string; name?: string }) {
  const lines = ['Assalam o Alaikum MobCheck team! I need help with:', context?.question ? `"${context.question}"` : '(please describe your question)'];
  if (context?.page) lines.push(`Page: ${context.page}`);
  if (context?.name) lines.push(`Name: ${context.name}`);
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export type Faq = { id: string; q: string; a: string; keywords: string[]; link?: { href: string; label: string } };

export const FAQS = (fee: number, windowHours: number): Faq[] => [
  {
    id: 'what',
    q: 'What is MobCheck?',
    a: `MobCheck is a marketplace for used phones in Pakistan with professional inspections. Buy or sell a phone, and have any phone checked at a verified shop for Rs ${fee.toLocaleString()} before money changes hands.`,
    keywords: ['what', 'mobcheck', 'about', 'kya', 'hai'],
  },
  {
    id: 'inspection',
    q: 'How does an inspection work?',
    a: `Choose a verified shop and a time, pay Rs ${fee.toLocaleString()} online, and bring the phone. An inspector checks screen, battery, cameras, audio, network, sensors, IMEI, PTA status and iCloud/Google locks, photographs any defects and issues a report you can verify with its number or QR code.`,
    keywords: ['inspection', 'inspect', 'check', 'checklist', 'how', 'work', 'report', 'process'],
    link: { href: '/shops', label: 'Find a shop' },
  },
  {
    id: 'price',
    q: 'How much does it cost?',
    a: `A full inspection is Rs ${fee.toLocaleString()}, paid online when you book. Listing a phone for sale is free.`,
    keywords: ['price', 'cost', 'fee', 'charges', 'kitne', 'paise', 'rs', 'rupees', 'free'],
  },
  {
    id: 'refund',
    q: 'Can I cancel or get a refund?',
    a: `You can cancel for a full refund until the shop accepts your booking. If the shop declines, you are refunded in full. After the report is delivered you have ${windowHours} hours to raise a dispute if something is wrong; MobCheck reviews it and can refund you.`,
    keywords: ['refund', 'cancel', 'money', 'back', 'dispute', 'wapas', 'return'],
  },
  {
    id: 'sell',
    q: 'How do I sell my phone?',
    a: 'Create a free account, tap "Sell a phone", add clear photos and honest details, and publish. Photos are watermarked with MobCheck automatically. Buyers contact you through MobCheck Messages and can book an inspection before paying.',
    keywords: ['sell', 'selling', 'listing', 'post', 'ad', 'bechna', 'upload'],
    link: { href: '/listings/new', label: 'Sell a phone' },
  },
  {
    id: 'chat',
    q: 'Why can’t I share my number in chat?',
    a: 'To protect buyers and sellers from scams, phone numbers, email addresses and outside chat links are blocked in MobCheck Messages, and only photos of the phone, its box or accessories can be shared. Keeping the conversation on MobCheck means we can help if anything goes wrong.',
    keywords: ['number', 'phone number', 'email', 'whatsapp', 'share', 'contact', 'chat', 'message', 'blocked'],
  },
  {
    id: 'pta',
    q: 'What does PTA approved mean?',
    a: 'PTA-approved phones are registered with the Pakistan Telecommunication Authority and work with any local SIM. Non-PTA phones may stop working on Pakistani networks. Every MobCheck inspection checks the IMEI and PTA status.',
    keywords: ['pta', 'non pta', 'non-pta', 'approved', 'dirbs', 'imei', 'sim', 'register'],
  },
  {
    id: 'verify',
    q: 'How do I check that a report is real?',
    a: 'Enter the report number (for example MC-2026-1A2B3C4D) on the Verify page or scan the QR code on the report. If MobCheck issued it, you will see the device and the result.',
    keywords: ['verify', 'real', 'fake', 'genuine', 'qr', 'report number'],
    link: { href: '/verify', label: 'Verify a report' },
  },
  {
    id: 'shop',
    q: 'How can my shop join MobCheck?',
    a: 'Sign up as a shop owner and register your shop. MobCheck verifies new shops (usually within two working days). The first 30 days are free; after that the plan is Rs 1,200 per month. You earn from every inspection you perform.',
    keywords: ['shop', 'join', 'register', 'vendor', 'partner', 'dukaan', 'business', 'subscription'],
    link: { href: '/auth/register?role=SHOP_OWNER', label: 'Register your shop' },
  },
  {
    id: 'safety',
    q: 'How do I buy safely?',
    a: 'Never pay before seeing the phone. Meet in a public place or at a MobCheck shop, book an inspection, check the IMEI and PTA status, and make sure iCloud or Google account locks are removed.',
    keywords: ['safe', 'safety', 'scam', 'fraud', 'trust', 'dhoka'],
  },
];

export function matchFaq(question: string, faqs: Faq[]) {
  const q = question.toLowerCase();
  let best: { faq: Faq; score: number } | null = null;
  for (const faq of faqs) {
    const score = faq.keywords.reduce((n, k) => n + (q.includes(k) ? (k.includes(' ') ? 3 : 2) : 0), 0) + (q.includes(faq.q.toLowerCase().slice(0, 12)) ? 3 : 0);
    if (score > 0 && (!best || score > best.score)) best = { faq, score };
  }
  return best?.faq ?? null;
}
