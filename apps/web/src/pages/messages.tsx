import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { ArrowLeft, Clock, ImagePlus, Loader2, MessagesSquare, Send, ShieldAlert, ShieldCheck } from 'lucide-react';
import { requirePageAuth } from '@/lib/ssr-auth';
import { SiteLayout } from '@/components/layout/Layouts';
import { EmptyState } from '@/components/ui/Feedback';
import { Avatar } from '@/components/ui/Avatar';
import { api, ApiError } from '@/lib/client';
import { CONTACT_WARNING, detectContact } from '@/lib/contact-detect';
import { formatDate, timeAgo } from '@/lib/format';
import { cn } from '@/lib/cn';

type Conv = { id: string; kind: string; otherName: string; context: string; contextHref: string | null; lastMessage: string; lastAt: string; unread: boolean };
type Msg = { id: string; mine: boolean; body: string | null; imageUrl: string | null; status: string; note: string | null; createdAt: string };

export const getServerSideProps: GetServerSideProps = (ctx) => requirePageAuth(ctx);

export default function Messages() {
  const router = useRouter();
  const activeId = typeof router.query.c === 'string' ? router.query.c : null;
  const [convs, setConvs] = useState<Conv[] | null>(null);
  const [msgs, setMsgs] = useState<Msg[] | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const active = convs?.find((c) => c.id === activeId) || null;
  const livePreview = detectContact(text);

  const loadConvs = useCallback(async () => {
    try {
      setConvs((await api<{ items: Conv[] }>('/api/conversations', { background: true })).items);
    } catch {
      setConvs((c) => c ?? []);
    }
  }, []);

  const loadMsgs = useCallback(async (id: string) => {
    try {
      const { messages } = await api<{ messages: Msg[] }>(`/api/conversations/${id}/messages`, { background: true });
      setMsgs((prev) => (prev && prev.length === messages.length && prev[prev.length - 1]?.id === messages[messages.length - 1]?.id ? prev : messages));
    } catch {
      setMsgs((m) => m ?? []);
    }
  }, []);

  useEffect(() => {
    loadConvs();
    const t = setInterval(loadConvs, 15000);
    return () => clearInterval(t);
  }, [loadConvs]);

  useEffect(() => {
    setMsgs(null);
    setWarning('');
    setError('');
    if (!activeId) return;
    loadMsgs(activeId).then(loadConvs);
    const t = setInterval(() => loadMsgs(activeId), 4000);
    return () => clearInterval(t);
  }, [activeId, loadMsgs, loadConvs]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [msgs?.length]);

  const send = async (file?: File) => {
    if (!activeId || sending || (!text.trim() && !file)) return;
    const sent = text.trim();
    setSending(true);
    setWarning('');
    setError('');
    try {
      let result: { message: Msg };
      if (file) {
        const form = new FormData();
        form.append('file', file);
        if (sent) form.append('body', sent);
        result = await api(`/api/conversations/${activeId}/messages`, { formData: form });
      } else {
        result = await api(`/api/conversations/${activeId}/messages`, { body: { body: sent } });
      }
      setMsgs((m) => [...(m || []), result.message]);
      // Only clear the box if the user hasn't started typing something new meanwhile.
      setText((t) => (t.trim() === sent ? '' : t));
      loadConvs();
    } catch (err) {
      const e = err as ApiError & { status: number };
      if (e.status === 422) {
        setWarning(e.message);
        await loadMsgs(activeId);
      } else setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const list = (
    <aside className={cn('flex min-h-0 flex-col border-slate-200 bg-white md:border-r', activeId && 'hidden md:flex')}>
      <div className="border-b border-slate-100 px-4 py-4">
        <h1 className="text-xl font-bold">Messages</h1>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-600"><ShieldCheck className="h-3.5 w-3.5 text-brand-700" aria-hidden />Private chats, protected by MobCheck</p>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto" aria-label="Conversations">
        {convs === null ? (
          <li className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin text-slate-400" aria-label="Loading" /></li>
        ) : convs.length === 0 ? (
          <li className="p-4"><EmptyState icon={MessagesSquare} title="No conversations yet" description="Chat with a seller from any listing, or with a shop from its profile." className="border-0 px-2 py-8" /></li>
        ) : (
          convs.map((c) => (
            <li key={c.id}>
              <Link href={{ pathname: '/messages', query: { c: c.id } }} scroll={false} className={cn('flex gap-3 border-b border-slate-100 px-4 py-3 hover:bg-slate-50', c.id === activeId && 'bg-lime-100/60')}>
                <Avatar name={c.otherName} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={cn('truncate text-sm', c.unread ? 'font-bold' : 'font-semibold')}>{c.otherName}</p>
                    <span className="shrink-0 text-[11px] text-slate-600">{timeAgo(c.lastAt)}</span>
                  </div>
                  <p className="truncate text-xs text-slate-600">{c.context}</p>
                  <p className={cn('mt-0.5 truncate text-sm', c.unread ? 'font-semibold text-ink' : 'text-slate-600')}>{c.lastMessage}</p>
                </div>
                {c.unread && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" aria-label="Unread" />}
              </Link>
            </li>
          ))
        )}
      </ul>
    </aside>
  );

  const thread = activeId ? (
    <section className="flex min-h-0 flex-col bg-[#f6f7f4]" aria-label="Conversation">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <Link href="/messages" className="-ml-1 rounded-full p-2 hover:bg-ink/5 md:hidden" aria-label="Back to conversations"><ArrowLeft className="h-5 w-5" /></Link>
        <Avatar name={active?.otherName || '?'} size="lg" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{active?.otherName || 'Conversation'}</p>
          {active && (active.contextHref ? <Link href={active.contextHref} className="block truncate text-xs text-slate-600 underline-offset-2 hover:underline">{active.context}</Link> : <p className="truncate text-xs text-slate-600">{active.context}</p>)}
        </div>
      </header>
      <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>Phone numbers, emails and outside chat links are blocked here. Only photos of the phone, its box or accessories can be shared. Never pay before seeing the phone.</p>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4" aria-live="polite">
        {msgs === null ? (
          <div className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin text-slate-400" aria-label="Loading messages" /></div>
        ) : msgs.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-600">Say hello. Ask about condition, battery or meeting for an inspection.</p>
        ) : (
          msgs.map((m) => <Bubble key={m.id} m={m} />)
        )}
        <div ref={bottom} />
      </div>
      {(warning || livePreview) && (
        <div role="alert" className="mx-4 mb-2 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" data-testid="chat-warning">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{warning || `${CONTACT_WARNING} (We spotted ${livePreview!.reason}.)`}</p>
        </div>
      )}
      {error && <p role="alert" className="mx-4 mb-2 text-sm text-red-700">{error}</p>}
      <form
        className="flex items-end gap-2 border-t border-slate-200 bg-white p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <button type="button" onClick={() => fileInput.current?.click()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-700 hover:bg-ink/5" aria-label="Attach a photo of the phone" disabled={sending}>
          <ImagePlus className="h-5 w-5" />
        </button>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Photo to send" data-testid="chat-photo-input" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) send(f); }} />
        <textarea
          aria-label="Message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder="Write a message…"
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
        />
        <button type="submit" disabled={sending || !text.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-white transition hover:bg-slate-800 active:scale-95 disabled:opacity-40" aria-label="Send message">
          {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </form>
    </section>
  ) : (
    <section className="hidden items-center justify-center bg-[#f6f7f4] md:flex">
      <EmptyState icon={MessagesSquare} title="Choose a conversation" description="Your chats with sellers, buyers and shops appear here." className="border-0 bg-transparent" />
    </section>
  );

  return (
    <SiteLayout title="Messages" footer={false}>
      <div className="page-container py-4 sm:py-6">
        <div className="grid h-[calc(100vh-13rem)] min-h-[480px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card md:grid-cols-[340px_1fr]">
          {list}
          {thread}
        </div>
      </div>
    </SiteLayout>
  );
}

function Bubble({ m }: { m: Msg }) {
  if (m.status === 'BLOCKED' || m.status === 'REJECTED') {
    return (
      <div className="flex justify-end" data-testid="blocked-message">
        <div className="max-w-[80%] rounded-2xl border border-dashed border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          <p className="flex items-center gap-1.5 font-semibold"><ShieldAlert className="h-4 w-4" aria-hidden />{m.note || 'Not sent'}</p>
          {m.body && <p className="mt-1 text-red-700/80 line-through decoration-red-400">{m.body}</p>}
        </div>
      </div>
    );
  }
  return (
    <div className={cn('flex', m.mine ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[80%] overflow-hidden rounded-2xl text-sm shadow-card', m.mine ? 'rounded-br-md bg-ink text-white' : 'rounded-bl-md bg-white text-ink')}>
        {m.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.imageUrl} alt="Photo shared in chat" className="max-h-72 w-full object-cover" />
        )}
        {m.body && <p className="whitespace-pre-line break-words px-3.5 py-2">{m.body}</p>}
        <p className={cn('flex items-center gap-1 px-3.5 pb-1.5 text-[11px]', m.mine ? 'text-slate-300' : 'text-slate-600')}>
          {m.status === 'PENDING_REVIEW' && <><Clock className="h-3 w-3" aria-hidden />Waiting for safety check ·</>}
          {formatDate(m.createdAt, true)}
        </p>
      </div>
    </div>
  );
}
