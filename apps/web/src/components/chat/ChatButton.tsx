import { useState } from 'react';
import { useRouter } from 'next/router';
import { MessagesSquare } from 'lucide-react';
import { Button, LinkButton } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError } from '@/lib/client';

// Opens (or creates) the in-app conversation for a listing, shop or booking.
export function ChatButton({
  kind,
  refId,
  label,
  variant = 'primary',
  size = 'lg',
  className,
}: {
  kind: 'LISTING' | 'SHOP' | 'BOOKING';
  refId: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  if (!user) {
    return (
      <LinkButton href={`/auth/login?next=${encodeURIComponent(router.asPath)}`} variant={variant} size={size} className={className}>
        <MessagesSquare className="h-4 w-4" aria-hidden />Log in to {label.charAt(0).toLowerCase() + label.slice(1)}
      </LinkButton>
    );
  }
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      loading={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const { data } = await api<{ data: { id: string } }>('/api/conversations', { body: { kind, refId } });
          await router.push(`/messages?c=${data.id}`);
        } catch (err) {
          toast('error', (err as ApiError).message);
          setBusy(false);
        }
      }}
    >
      <MessagesSquare className="h-4 w-4" aria-hidden />
      {label}
    </Button>
  );
}
