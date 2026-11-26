import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface User {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface AdminStats {
  customers: number;
  shops: { total: number; verified: number; pendingVerification: number };
  listings: number;
  inspections: { total: number; completed: number };
  payments: { total: number; revenue: string | number };
}

const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: 'Customer',
  SELLER: 'Seller',
  SHOP_OWNER: 'Shop Owner',
  INSPECTOR: 'Inspector',
  SUPPORT: 'Support',
  OPS_ADMIN: 'Operations Admin',
  SUPER_ADMIN: 'Super Admin',
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) {
      router.replace('/auth/login');
      return;
    }
    const u: User = JSON.parse(stored);
    setUser(u);
    if (['SUPER_ADMIN', 'OPS_ADMIN'].includes(u.role)) {
      fetch('/api/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setStats(d.data));
    }
  }, [router]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) return null;

  const isAdmin = ['SUPER_ADMIN', 'OPS_ADMIN'].includes(user.role);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/" className="text-2xl font-bold text-indigo-600">MobCheck</a>
          <div className="flex gap-4 items-center">
            <span className="text-gray-700 hidden sm:inline">{user.email}</span>
            <button onClick={logout} className="bg-gray-100 text-gray-800 px-4 py-2 rounded hover:bg-gray-200">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-1">Welcome, {user.firstName}!</h1>
        <p className="text-gray-600 mb-8">Signed in as {ROLE_LABELS[user.role] || user.role}</p>

        {isAdmin && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              ['Customers', stats.customers],
              ['Verified Shops', `${stats.shops.verified} / ${stats.shops.total}`],
              ['Pending Verifications', stats.shops.pendingVerification],
              ['Active Listings', stats.listings],
              ['Inspections', stats.inspections.total],
              ['Completed Inspections', stats.inspections.completed],
              ['Payments', stats.payments.total],
              ['Revenue (Rs.)', Number(stats.payments.revenue).toLocaleString()],
            ].map(([label, value]) => (
              <div key={label as string} className="bg-white rounded-lg shadow p-5">
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-indigo-600">{value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a href="/marketplace" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="text-3xl mb-2">📱</div>
            <h3 className="font-semibold text-lg">Browse Phones</h3>
            <p className="text-gray-600 text-sm">See listings across Pakistan</p>
          </a>
          <a href="/shops" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="text-3xl mb-2">🏪</div>
            <h3 className="font-semibold text-lg">Verified Shops</h3>
            <p className="text-gray-600 text-sm">Book a professional inspection</p>
          </a>
          <a href="/" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="text-3xl mb-2">🏠</div>
            <h3 className="font-semibold text-lg">Home</h3>
            <p className="text-gray-600 text-sm">Back to the MobCheck homepage</p>
          </a>
        </div>
      </div>
    </div>
  );
}
