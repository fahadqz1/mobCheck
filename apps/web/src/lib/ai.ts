import Anthropic from '@anthropic-ai/sdk';

export const AI_MODEL = 'claude-opus-5-5';

// AI features switch on when credentials are configured; otherwise callers use their non-AI fallback.
export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

let client: Anthropic | null = null;
export function anthropic() {
  if (!client) client = new Anthropic();
  return client;
}

export function textOf(content: Anthropic.Beta.BetaContentBlock[]) {
  return content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
}

export type ImageVerdict = { verdict: 'phone' | 'not_phone' | 'contact' | 'unknown'; reason: string };

// Asks Claude whether a chat photo shows a mobile phone and whether it carries contact details.
export async function classifyChatImage(data: Buffer, mime: 'image/jpeg' | 'image/png' | 'image/webp'): Promise<ImageVerdict> {
  if (!aiEnabled()) return { verdict: 'unknown', reason: 'Automatic photo checks are not configured' };
  try {
    const response = await anthropic().beta.messages.create({
      model: AI_MODEL,
      max_tokens: 1024,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system:
        'You moderate photos sent in a used-phone marketplace chat. Allowed: photos of a mobile phone or its parts, box, accessories, screen, settings or battery pages. ' +
        'Not allowed: anything else, and any image showing a phone number, email address, QR code, social media handle or other contact details. ' +
        'Reply with only a JSON object: {"is_mobile_phone": boolean, "shows_contact_details": boolean, "reason": "<one short sentence>"}.',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mime, data: data.toString('base64') } },
            { type: 'text', text: 'Classify this photo.' },
          ],
        },
      ],
    });
    if (response.stop_reason === 'refusal') return { verdict: 'not_phone', reason: 'This photo was declined by the automatic check' };
    const raw = textOf(response.content);
    const json = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
    if (json.shows_contact_details === true) return { verdict: 'contact', reason: String(json.reason || 'Contains contact details') };
    if (json.is_mobile_phone === true) return { verdict: 'phone', reason: String(json.reason || '') };
    if (json.is_mobile_phone === false) return { verdict: 'not_phone', reason: String(json.reason || 'Not a photo of a phone') };
    return { verdict: 'unknown', reason: 'Unclear result' };
  } catch (error) {
    console.error('classifyChatImage failed', error);
    return { verdict: 'unknown', reason: 'Automatic check unavailable' };
  }
}
