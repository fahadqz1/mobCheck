import { Store } from 'lucide-react';
import { EmptyState } from '@/components/ui/Feedback';
import { LinkButton } from '@/components/ui/Button';

export function NeedsShop() {
  return (
    <EmptyState
      icon={Store}
      title="Register your shop first"
      description="Add your shop details to manage services, inspectors and bookings."
      action={<LinkButton href="/vendor/shop">Register shop</LinkButton>}
    />
  );
}
