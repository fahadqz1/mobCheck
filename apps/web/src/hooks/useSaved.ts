import { useCallback, useEffect, useState } from 'react';

// Saved phones live in this browser only (a per-viewer convenience, not account data).
const KEY = 'mobcheck:saved-listings';
const EVENT = 'mobcheck:saved-changed';

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 100) : [];
  } catch {
    return [];
  }
}

export function useSaved() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    setIds(read());
    const sync = () => setIds(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  const toggle = useCallback((id: string) => {
    const current = read();
    const next = current.includes(id) ? current.filter((x) => x !== id) : [id, ...current];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // storage unavailable: the heart simply won't persist
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return { ids, isSaved: (id: string) => ids.includes(id), toggle };
}
