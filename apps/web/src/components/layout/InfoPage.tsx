import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { SUPPORT_WHATSAPP_DISPLAY, supportWhatsappLink } from '@/lib/help-content';
import { SiteLayout } from './Layouts';

export type InfoSection = { id: string; title: string; body: React.ReactNode };

// Shared layout for About / Terms / Privacy / Refunds: title, contents list, sections, contact card.
export function InfoPage({ title, intro, updated, sections, page }: { title: string; intro: React.ReactNode; updated?: string; sections: InfoSection[]; page: string }) {
  return (
    <SiteLayout title={title}>
      <article className="page-container max-w-3xl py-10 sm:py-14">
        <h1 className="display text-4xl sm:text-5xl">{title}</h1>
        {updated && <p className="mt-2 text-sm text-slate-600">Last updated {updated}</p>}
        <div className="mt-4 text-lg text-slate-700">{intro}</div>

        <nav aria-label="On this page" className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">On this page</p>
          <ol className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {sections.map((s, i) => (
              <li key={s.id}><Link href={`#${s.id}`} className="text-ink underline decoration-ink/20 underline-offset-4 hover:decoration-ink">{i + 1}. {s.title}</Link></li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-32">
              <h2 className="text-xl font-bold sm:text-2xl">{i + 1}. {s.title}</h2>
              <div className="mt-3 space-y-3 text-[15px] leading-7 text-slate-700">{s.body}</div>
            </section>
          ))}
        </div>

        <aside className="mt-12 flex flex-col gap-4 rounded-3xl bg-ink p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Questions about this page?</p>
            <p className="mt-1 text-sm text-white/75">Our team answers on WhatsApp, or visit the <Link href="/help" className="underline underline-offset-4">Help centre</Link>.</p>
          </div>
          <a href={supportWhatsappLink({ page })} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#157a3f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#106533]">
            <MessageCircle className="h-4 w-4" aria-hidden />{SUPPORT_WHATSAPP_DISPLAY}
          </a>
        </aside>
      </article>
    </SiteLayout>
  );
}

export const Bullets = ({ items }: { items: React.ReactNode[] }) => (
  <ul className="list-disc space-y-1.5 pl-5">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
);
