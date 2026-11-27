import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import QRCode from 'qrcode';
import { CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';
import prisma from '@/lib/prisma';
import { getSsrUser } from '@/lib/ssr-auth';
import { serialize } from '@/lib/serialize';
import { SiteLayout } from '@/components/layout/Layouts';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Feedback';
import { LinkButton } from '@/components/ui/Button';
import { ASSESSMENT, formatDate } from '@/lib/format';

type Props = {
  report: null | {
    reportNumber: string;
    issuedAt: string;
    device: string;
    storageGb: number | null;
    assessment: string;
    summary: string | null;
    shop: { name: string; slug: string; city: string };
    totals: { pass: number; fail: number; attention: number; total: number };
    categories: { category: string; pass: number; issues: number }[];
  };
  reportNumber: string;
  qr: string | null;
  user: any;
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const reportNumber = String(ctx.params?.reportNumber || '').toUpperCase();
  const user = await getSsrUser(ctx);
  const r = await prisma.inspectionReport.findUnique({
    where: { reportNumber },
    include: {
      booking: {
        select: {
          deviceStorageGb: true,
          brand: { select: { name: true } },
          model: { select: { name: true } },
          shop: { select: { name: true, slug: true, city: true } },
          inspectionResults: { select: { result: true, checklist: { select: { category: true, categorySequence: true } } } },
        },
      },
    },
  });
  if (!r || !r.isVerified) {
    ctx.res.statusCode = 404;
    return { props: { report: null, reportNumber, qr: null, user } };
  }
  const results = r.booking.inspectionResults;
  const byCat = new Map<string, { category: string; seq: number; pass: number; issues: number }>();
  results.forEach((x) => {
    const c = byCat.get(x.checklist.category) || { category: x.checklist.category, seq: x.checklist.categorySequence, pass: 0, issues: 0 };
    if (x.result === 'PASS') c.pass++;
    if (x.result === 'FAIL' || x.result === 'NEEDS_ATTENTION') c.issues++;
    byCat.set(x.checklist.category, c);
  });
  const proto = (ctx.req.headers['x-forwarded-proto'] as string) || 'http';
  const url = `${proto}://${ctx.req.headers.host}/reports/${reportNumber}`;
  return {
    props: serialize({
      reportNumber,
      user,
      qr: await QRCode.toDataURL(url, { margin: 1, width: 160, color: { dark: '#0b1220', light: '#ffffff' } }),
      report: {
        reportNumber: r.reportNumber,
        issuedAt: r.createdAt.toISOString(),
        device: `${r.booking.brand.name} ${r.booking.model.name}`,
        storageGb: r.booking.deviceStorageGb,
        assessment: r.overallAssessment,
        summary: r.assessmentSummary,
        shop: r.booking.shop,
        totals: {
          pass: results.filter((x) => x.result === 'PASS').length,
          fail: results.filter((x) => x.result === 'FAIL').length,
          attention: results.filter((x) => x.result === 'NEEDS_ATTENTION').length,
          total: results.length,
        },
        categories: Array.from(byCat.values()).sort((a, b) => a.seq - b.seq).map(({ category, pass, issues }) => ({ category, pass, issues })),
      },
    }),
  };
};

export default function PublicReport({ report, reportNumber, qr }: Props) {
  if (!report) {
    return (
      <SiteLayout title="Report not found">
        <div className="page-container max-w-xl py-16 text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500" aria-hidden />
          <h1 className="mt-4 text-2xl font-semibold">No report found for {reportNumber}</h1>
          <p className="mt-2 text-slate-600">Check the number and try again. A report that cannot be found here was not issued by MobCheck.</p>
          <LinkButton href="/verify" className="mt-6">Check another report</LinkButton>
        </div>
      </SiteLayout>
    );
  }
  const a = ASSESSMENT[report.assessment];
  return (
    <SiteLayout title={`Report ${report.reportNumber}`}>
      <div className="page-container max-w-3xl py-10">
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <CheckCircle2 className="h-6 w-6 shrink-0" aria-hidden />
          <p><span className="font-semibold">Authentic MobCheck report.</span> This report was issued by a verified shop through MobCheck.</p>
        </div>
        <Card className="mt-6 p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-slate-600">Report {report.reportNumber}</p>
              <h1 className="mt-1 text-2xl font-semibold">{report.device}{report.storageGb ? ` · ${report.storageGb} GB` : ''}</h1>
              <p className="mt-1 text-sm text-slate-600">Inspected by <Link href={`/shops/${report.shop.slug}`} className="link">{report.shop.name}</Link>, {report.shop.city} · {formatDate(report.issuedAt, true)}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge tone={a.tone} className="px-3 py-1 text-sm">Overall: {a.label}</Badge>
                <span className="text-sm text-slate-600">{report.totals.pass}/{report.totals.total} checks passed</span>
              </div>
              {report.summary && <p className="mt-3 max-w-lg text-sm text-slate-700">{report.summary}</p>}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {qr && <img src={qr} alt="QR code linking to this verification page" className="h-32 w-32 shrink-0 rounded-lg border border-slate-200" />}
          </div>
          <h2 className="mt-8 text-sm font-semibold">Results by area</h2>
          <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {report.categories.map((c) => (
              <li key={c.category} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{c.category}</span>
                {c.issues > 0 ? <Badge tone="warning">{c.issues} issue{c.issues > 1 ? 's' : ''} noted</Badge> : <Badge tone="success">No issues</Badge>}
              </li>
            ))}
          </ul>
          <p className="mt-6 flex gap-2 text-xs text-slate-600">
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
            For privacy, this public page leaves out the device IMEI, photos and the buyer&apos;s details. The full report is available to the person who booked the inspection. A report describes the phone at the time of inspection and is not a warranty.
          </p>
        </Card>
      </div>
    </SiteLayout>
  );
}
