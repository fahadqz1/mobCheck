import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { ChevronDown, MessageCircle, Sparkles } from 'lucide-react';
import { getSsrUser } from '@/lib/ssr-auth';
import { serialize } from '@/lib/serialize';
import { getInspectionFee, getReviewWindowHours } from '@/lib/settings';
import { FAQS, SUPPORT_WHATSAPP_DISPLAY, supportWhatsappLink, type Faq } from '@/lib/help-content';
import { SiteLayout } from '@/components/layout/Layouts';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const [fee, hours, user] = await Promise.all([getInspectionFee(), getReviewWindowHours(), getSsrUser(ctx)]);
  return { props: serialize({ faqs: FAQS(fee, hours), user }) };
};

export default function Help({ faqs }: { faqs: Faq[] }) {
  return (
    <SiteLayout title="Help centre">
      <section className="page-container max-w-3xl py-10 sm:py-14">
        <h1 className="display text-4xl sm:text-5xl">How can we help?</h1>
        <p className="mt-3 text-slate-600">Answers to common questions. Need a person? Our team is on WhatsApp.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <a href={supportWhatsappLink({ page: '/help' })} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-3xl bg-[#157a3f] p-5 text-white transition hover:-translate-y-0.5">
            <MessageCircle className="h-6 w-6 shrink-0" aria-hidden />
            <span><span className="block font-semibold">WhatsApp our team</span><span className="text-sm text-white/85">{SUPPORT_WHATSAPP_DISPLAY}</span></span>
          </a>
          <div className="flex items-center gap-3 rounded-3xl bg-lime-300 p-5 text-ink">
            <Sparkles className="h-6 w-6 shrink-0" aria-hidden />
            <span><span className="block font-semibold">Ask the assistant</span><span className="text-sm text-ink/75">Tap “Help” at the bottom right of any page</span></span>
          </div>
        </div>
        <ul className="mt-10 space-y-3">
          {faqs.map((f) => (
            <li key={f.id} id={f.id} className="scroll-mt-32">
              <details className="group rounded-2xl border border-slate-200 bg-white shadow-card open:shadow-raised">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold">
                  {f.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-slate-500 transition group-open:rotate-180" aria-hidden />
                </summary>
                <div className="px-5 pb-5 text-sm leading-6 text-slate-700">
                  <p>{f.a}</p>
                  {f.link && <Link href={f.link.href} className="link mt-2 inline-block">{f.link.label} →</Link>}
                </div>
              </details>
            </li>
          ))}
        </ul>
      </section>
    </SiteLayout>
  );
}
