import Link from 'next/link';
import Head from 'next/head';

// Rendered statically without the auth-aware layout, so it works even when the database is down.
export default function ServerError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Head>
        <title>Something went wrong · MobCheck</title>
      </Head>
      <p className="text-sm font-semibold text-brand-700">500</p>
      <h1 className="mt-1 text-3xl font-semibold">Something went wrong on our side</h1>
      <p className="mt-3 max-w-md text-slate-600">Please try again in a moment. If it keeps happening, contact MobCheck support.</p>
      <Link href="/" className="mt-8 inline-flex h-10 items-center rounded-lg bg-brand-700 px-4 text-sm font-medium text-white hover:bg-brand-800">Go home</Link>
    </div>
  );
}
