import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

// True while a same-page navigation (e.g. a filter change) is loading new server data.
export function useRouteLoading() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const start = (url: string) => {
      if (url.split('?')[0] === router.asPath.split('?')[0]) setLoading(true);
    };
    const stop = () => setLoading(false);
    router.events.on('routeChangeStart', start);
    router.events.on('routeChangeComplete', stop);
    router.events.on('routeChangeError', stop);
    return () => {
      router.events.off('routeChangeStart', start);
      router.events.off('routeChangeComplete', stop);
      router.events.off('routeChangeError', stop);
    };
  }, [router]);
  return loading;
}
