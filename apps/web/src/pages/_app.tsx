import type { AppProps } from 'next/app';
import Head from 'next/head';
import '@fontsource-variable/inter';
import '@fontsource-variable/bricolage-grotesque';
import '../styles/globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { HelpWidget } from '@/components/help/HelpWidget';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider initialUser={pageProps.user}>
      <ToastProvider>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>MobCheck · Check before you buy</title>
        </Head>
        <Component {...pageProps} />
        <HelpWidget />
      </ToastProvider>
    </AuthProvider>
  );
}
