// Detects attempts to share phone numbers, email addresses or off-platform chat links.
// Runs in the browser (instant warning) and on the server (enforcement), so it must stay dependency-free.

const DIGIT_WORDS: Record<string, string> = {
  zero: '0', oh: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9',
  // Romanised Urdu
  sifr: '0', sifar: '0', sefar: '0', aik: '1', ek: '1', do: '2', teen: '3', char: '4', chaar: '4', panch: '5', paanch: '5', chay: '6', che: '6', saat: '7', aath: '8', ath: '8', nau: '9', no: '9',
};

const toAsciiDigits = (s: string) =>
  s
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));

export type ContactMatch = { kind: 'phone' | 'email' | 'link'; reason: string };

export const CONTACT_WARNING =
  'For your safety, phone numbers, email addresses and outside chat links can’t be shared on MobCheck. Keep the conversation here so we can protect you if anything goes wrong.';

export function detectContact(input: string): ContactMatch | null {
  if (!input) return null;
  const text = toAsciiDigits(input.normalize('NFKC'));
  const lower = text.toLowerCase();

  if (/[a-z0-9._%+-]+\s*@\s*[a-z0-9-]+(\s*\.\s*[a-z]{2,})+/i.test(text)) return { kind: 'email', reason: 'an email address' };
  if (/\b[a-z0-9._%+-]{2,}\s*[[(]?\s*(at|@)\s*[\])]?\s*(gmail|yahoo|hotmail|outlook|icloud|live|proton(mail)?|ymail)\b/i.test(lower))
    return { kind: 'email', reason: 'an email address' };
  if (/\b(gmail|yahoo|hotmail|outlook|icloud)\s*(\.|dot)\s*com\b/i.test(lower)) return { kind: 'email', reason: 'an email address' };

  if (/(wa\.me|whatsapp\.com|chat\.whatsapp|t\.me\/|telegram\.me|m\.me\/|instagram\.com|facebook\.com|snapchat\.com)/i.test(lower))
    return { kind: 'link', reason: 'an outside chat or social media link' };

  // Spelled-out digits: "zero three zero zero ..." counts as digits.
  const spelled = lower.replace(/\b[a-z]+\b/g, (w) => (w in DIGIT_WORDS ? DIGIT_WORDS[w] : w));
  for (const candidate of [text, spelled]) {
    // Join digit groups separated by spaces, dashes, dots, slashes or brackets.
    const joined = candidate.replace(/(?<=\d)[\s\-.()/_,]+(?=[\d+])/g, '').replace(/\+(?=\d)/g, '');
    for (const run of joined.match(/\d{7,}/g) || []) {
      // 15-digit runs are IMEIs, which buyers legitimately share for PTA checks.
      if (run.length === 15) continue;
      if (/^(92|0092)?0?3\d{9}$/.test(run) || /^0\d{9,10}$/.test(run) || (run.length >= 10 && run.length <= 13)) {
        return { kind: 'phone', reason: 'a phone number' };
      }
    }
  }
  return null;
}
