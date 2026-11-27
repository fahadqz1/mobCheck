import { useCallback } from 'react';

// Moves a soft highlight (.liquid-sheen) to follow the pointer over a glass surface.
export function useSheen() {
  return useCallback((e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, []);
}
