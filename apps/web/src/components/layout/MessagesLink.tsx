import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { MessagesSquare } from 'lucide-react';
import { api } from '@/lib/client';

export function MessagesLink() {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const load = useCallback(async () => {
    try {
      setUnread((await api<{ unread: number }>('/api/conversations', { background: true })).unread);
    } catch {
      // header keeps working without the count
    }
  }, []);
  useEffect(() => {
    load();
    router.events.on('routeChangeComplete', load);
    const t = setInterval(load, 30000);
    return () => {
      router.events.off('routeChangeComplete', load);
      clearInterval(t);
    };
  }, [load, router.events]);

  return (
    <Link href="/messages" aria-label={unread ? `Messages, ${unread} unread` : 'Messages'} className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-ink/5 hover:text-ink">
      <MessagesSquare className="h-5 w-5" aria-hidden />
      {unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white" data-testid="messages-unread">{unread > 9 ? '9+' : unread}</span>}
    </Link>
  );
}
