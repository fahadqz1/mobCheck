import {
  LayoutDashboard,
  CalendarCheck,
  Smartphone,
  UserRound,
  Store,
  Wrench,
  Users,
  Star,
  CreditCard,
  ClipboardCheck,
  ShieldCheck,
  MessageSquareWarning,
  Receipt,
} from 'lucide-react';

export type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const profile: NavItem = { href: '/dashboard/profile', label: 'Profile & settings', icon: UserRound };

export function dashboardNav(role: string): NavItem[] {
  switch (role) {
    case 'SHOP_OWNER':
      return [
        { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { href: '/vendor/bookings', label: 'Bookings', icon: CalendarCheck },
        { href: '/vendor/shop', label: 'Shop profile', icon: Store },
        { href: '/vendor/services', label: 'Services & pricing', icon: Wrench },
        { href: '/vendor/inspectors', label: 'Inspectors', icon: Users },
        { href: '/vendor/reviews', label: 'Reviews', icon: Star },
        { href: '/vendor/subscription', label: 'Subscription', icon: CreditCard },
        profile,
      ];
    case 'INSPECTOR':
      return [
        { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { href: '/inspector', label: 'My inspections', icon: ClipboardCheck },
        profile,
      ];
    case 'SUPER_ADMIN':
    case 'OPS_ADMIN':
      return [
        { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { href: '/admin/shops', label: 'Shops', icon: ShieldCheck },
        { href: '/admin/listings', label: 'Listings', icon: Smartphone },
        { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
        { href: '/admin/complaints', label: 'Complaints', icon: MessageSquareWarning },
        { href: '/admin/users', label: 'Users', icon: Users },
        { href: '/admin/payments', label: 'Payments', icon: Receipt },
        profile,
      ];
    default:
      return [
        { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { href: '/dashboard/bookings', label: 'My inspections', icon: CalendarCheck },
        { href: '/dashboard/listings', label: 'My listings', icon: Smartphone },
        profile,
      ];
  }
}

export const ROLE_LABEL: Record<string, string> = {
  CUSTOMER: 'Customer',
  SELLER: 'Seller',
  SHOP_OWNER: 'Shop owner',
  INSPECTOR: 'Inspector',
  SUPPORT: 'Support',
  OPS_ADMIN: 'Operations admin',
  SUPER_ADMIN: 'Super admin',
};
