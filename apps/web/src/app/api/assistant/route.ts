import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { AI_MODEL, aiEnabled, anthropic, textOf } from '@/lib/ai';
import { FAQS, matchFaq, SUPPORT_WHATSAPP_DISPLAY } from '@/lib/help-content';
import { getInspectionFee, getReviewWindowHours } from '@/lib/settings';
import { getCurrentUser } from '@/lib/session';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { serverError } from '@/lib/api';

const Schema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(1500) }))
    .min(1)
    .max(20),
  page: z.string().max(200).optional(),
});

function systemPrompt(fee: number, windowHours: number) {
  const faq = FAQS(fee, windowHours).map((f) => `Q: ${f.q}\nA: ${f.a}`).join('\n\n');
  return `You are the MobCheck assistant on the MobCheck website. MobCheck is Pakistan's phone inspection marketplace: people buy and sell used phones and book professional inspections at verified shops.

Answer customers' questions about using MobCheck: buying, selling, booking and paying for inspections, refunds and disputes, reports, PTA, chat safety and shop registration. Reply in the language the customer writes in (English, Urdu or Roman Urdu). Keep answers short: two to four sentences, plain text, no markdown headings.

Facts you can rely on:
${faq}

Rules:
- Only state facts from the list above or general phone-buying safety advice. If you don't know something specific (a booking's status, a payment, an account problem), say you can't see account details and suggest WhatsApp support on ${SUPPORT_WHATSAPP_DISPLAY}.
- Never ask for or repeat passwords, card details, phone numbers or email addresses.
- Never promise refunds or outcomes; explain the process instead.
- Politely decline unrelated requests and steer back to MobCheck.`;
}

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(`assistant:${clientIp(request)}`, 30, 10 * 60 * 1000).ok) {
      return NextResponse.json({ error: 'You have asked a lot of questions. Please try again in a few minutes, or contact us on WhatsApp.' }, { status: 429 });
    }
    const body = Schema.safeParse(await request.json().catch(() => null));
    if (!body.success) return NextResponse.json({ error: 'Please type a question.' }, { status: 400 });
    const [fee, windowHours, user] = await Promise.all([getInspectionFee(), getReviewWindowHours(), getCurrentUser(request)]);
    const question = body.data.messages[body.data.messages.length - 1].content;

    if (!aiEnabled()) {
      const faq = matchFaq(question, FAQS(fee, windowHours));
      return NextResponse.json({
        mode: 'faq',
        reply: faq ? faq.a : 'I can answer questions about inspections, prices, refunds, selling, PTA, chat safety and shop registration. For anything else, our team can help on WhatsApp.',
        link: faq?.link ?? null,
        handoff: !faq,
      });
    }

    const messages: Anthropic.Beta.BetaMessageParam[] = body.data.messages.map((m) => ({ role: m.role, content: m.content }));
    const context = [`Current page: ${body.data.page || 'unknown'}`, user ? `The customer is signed in as a ${user.role.toLowerCase().replace('_', ' ')} named ${user.firstName || 'customer'}.` : 'The customer is not signed in.'].join(' ');
    const response = await anthropic().beta.messages.create({
      model: AI_MODEL,
      max_tokens: 1024,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: [{ type: 'text', text: systemPrompt(fee, windowHours), cache_control: { type: 'ephemeral' } }],
      messages: [...messages.slice(0, -1), { role: 'user', content: `${context}\n\n${question}` }],
    });
    if (response.stop_reason === 'refusal') {
      return NextResponse.json({ mode: 'ai', reply: "I can't help with that here. Our team can help on WhatsApp.", handoff: true });
    }
    return NextResponse.json({ mode: 'ai', reply: textOf(response.content) || 'Sorry, I could not answer that. Please contact us on WhatsApp.', handoff: false });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error('Assistant API error', error.status, error.message);
      return NextResponse.json({ mode: 'ai', reply: 'The assistant is having trouble right now. Our team can help you on WhatsApp.', handoff: true });
    }
    return serverError('Assistant error', error);
  }
}
