import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Bell } from 'lucide-react';
import { Dropdown } from '@/components/ui/Dropdown';
import { api } from '@/lib/client';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/cn';

type Item = { id: string; title: string; body: string | null; link: string | null; readAt: string | null; createdAt: string };

export function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      const data = await api<{ items: Item[]; unread: number }>('/api/notifications');
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      // the header must keep working if notifications fail
    }
  }, []);

  useEffect(() => {
    load();
    router.events.on('routeChangeComplete', load);
    const t = setInterval(load, 60000);
    return () => {
      router.events.off('routeChangeComplete', load);
      clearInterval(t);
    };
  }, [load, router.events]);

  const markAll = async () => {
    await api('/api/notifications', { body: {} }).catch(() => {});
    load();
  };

  return (
    <Dropdown
      label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
      triggerClassName="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-ink"
      menuClassName="-right-12 w-80 max-w-[calc(100vw-2rem)] sm:right-0"
      trigger={
        <>
          <Bell className="h-5 w-5" aria-hidden />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white" data-testid="unread-count">{unread > 9 ? '9+' : unread}</span>}
        </>
      }
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 px-3.5 pb-2 pt-1">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && <button type="button" onClick={markAll} className="text-xs font-medium text-brand-700 hover:underline">Mark all read</button>}
          </div>
          {items.length === 0 ? (
            <p className="px-3.5 py-6 text-center text-sm text-slate-500">You&apos;re all caught up.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.link || '/dashboard'}
                    role="menuitem"
                    onClick={() => {
                      close();
                      if (!n.readAt) api('/api/notifications', { body: { id: n.id } }).then(load).catch(() => {});
                    }}
                    className={cn('block px-3.5 py-2.5 hover:bg-slate-50', !n.readAt && 'bg-brand-50/50')}
                  >
                    <p className={cn('text-sm', !n.readAt ? 'font-medium text-ink' : 'text-slate-700')}>{n.title}</p>
                    {n.body && <p className="line-clamp-2 text-xs text-slate-500">{n.body}</p>}
                    <p className="mt-0.5 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Dropdown>
  );
}
