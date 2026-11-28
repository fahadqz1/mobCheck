import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Loader2, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api, ApiError } from '@/lib/client';
import { supportWhatsappLink } from '@/lib/help-content';
import { cn } from '@/lib/cn';

type Msg = { role: 'user' | 'assistant'; content: string; link?: { href: string; label: string } | null };

const SUGGESTIONS = ['How does an inspection work?', 'How much does it cost?', 'How do I sell my phone?', 'Can I get a refund?', 'What is PTA approved?'];
const STORE_KEY = 'mobcheck:help-chat';
const HIDDEN_ON = ['/messages'];

export function HelpWidget() {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'ai' | 'faq' | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORE_KEY);
      if (saved) setMsgs(JSON.parse(saved));
    } catch {
      // storage unavailable
    }
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(msgs.slice(-20)));
    } catch {
      // storage unavailable
    }
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [msgs]);
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (HIDDEN_ON.includes(router.pathname)) return null;

  const lastQuestion = [...msgs].reverse().find((m) => m.role === 'user')?.content;
  const whatsapp = supportWhatsappLink({ page: router.asPath, question: lastQuestion, name: user?.firstName || undefined });

  const ask = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: 'user', content: q }];
    setMsgs(next);
    setInput('');
    setBusy(true);
    try {
      const res = await api<{ reply: string; mode: 'ai' | 'faq'; link?: Msg['link'] }>('/api/assistant', {
        body: { messages: next.slice(-12).map(({ role, content }) => ({ role, content })), page: router.asPath },
      });
      setMode(res.mode);
      setMsgs((m) => [...m, { role: 'assistant', content: res.reply, link: res.link }]);
    } catch (err) {
      setMsgs((m) => [...m, { role: 'assistant', content: (err as ApiError).message || 'Something went wrong. Please try WhatsApp.' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {open && (
        <section
          role="dialog"
          aria-label="MobCheck help"
          className="glass-strong fixed inset-x-3 bottom-24 z-50 flex max-h-[min(620px,calc(100vh-8rem))] flex-col overflow-hidden rounded-3xl sm:inset-x-auto sm:right-6 sm:w-[380px]"
          data-testid="help-widget"
        >
          <header className="flex items-center gap-3 bg-ink px-4 py-3 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-lime-300 text-ink"><Sparkles className="h-5 w-5" aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">MobCheck Help</p>
              <p className="text-xs text-slate-300">{mode === 'faq' ? 'Instant answers · human help on WhatsApp' : 'AI assistant · instant answers, 24/7'}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close help" className="rounded-full p-1.5 hover:bg-white/10"><X className="h-5 w-5" /></button>
          </header>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-white/70 px-4 py-4" aria-live="polite">
            <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-sm text-ink shadow-card">
              Hi{user?.firstName ? ` ${user.firstName}` : ''}! I&apos;m the MobCheck assistant. Ask me about inspections, prices, selling, refunds or PTA. You can write in English or Urdu.
            </div>
            {msgs.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => ask(s)} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink ring-1 ring-ink/10 hover:ring-ink/30">{s}</button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm shadow-card', m.role === 'user' ? 'rounded-br-md bg-ink text-white' : 'rounded-bl-md bg-white text-ink')}>
                  {m.content}
                  {m.link && (
                    <Link href={m.link.href} onClick={() => setOpen(false)} className="mt-2 block font-semibold text-ink underline underline-offset-2">{m.link.label} →</Link>
                  )}
                </div>
              </div>
            ))}
            {busy && <div className="flex items-center gap-2 text-xs text-slate-600"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Typing…</div>}
            <div ref={bottom} />
          </div>

          <form
            className="flex items-center gap-2 border-t border-ink/10 bg-white px-3 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <input ref={inputRef} aria-label="Ask a question" value={input} onChange={(e) => setInput(e.target.value)} maxLength={500} placeholder="Type your question…" className="h-11 min-w-0 flex-1 rounded-full border border-slate-300 px-4 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10" />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Send question" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-white disabled:opacity-40"><Send className="h-5 w-5" /></button>
          </form>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-[#157a3f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#106533]" data-testid="help-whatsapp">
            <MessageCircle className="h-4 w-4" aria-hidden />Talk to our team on WhatsApp
          </a>
        </section>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close help' : 'Open help: ask MobCheck'}
        className="fixed bottom-5 right-5 z-50 inline-flex h-14 items-center gap-2 rounded-full bg-ink pl-4 pr-5 text-sm font-semibold text-white shadow-overlay ring-4 ring-lime-300/60 transition hover:-translate-y-0.5 active:scale-95"
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Sparkles className="h-5 w-5 text-lime-300" aria-hidden />}
        <span>{open ? 'Close' : 'Help'}</span>
      </button>
    </>
  );
}
