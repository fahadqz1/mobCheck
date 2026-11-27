import { useState } from 'react';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import type { Prisma, UserRole } from '@prisma/client';
import { Search } from 'lucide-react';
import prisma from '@/lib/prisma';
import { requirePageAuth } from '@/lib/ssr-auth';
import { DashboardLayout } from '@/components/layout/Layouts';
import { Card } from '@/components/ui/Card';
import { Badge, EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Form';
import { Table, Td, Th } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError } from '@/lib/client';
import { formatDate, fullName } from '@/lib/format';
import { ROLE_LABEL } from '@/lib/nav';
import { useAuth } from '@/context/AuthContext';

const PAGE_SIZE = 25;
const ROLES = Object.keys(ROLE_LABEL) as UserRole[];

export const getServerSideProps: GetServerSideProps = (ctx) =>
  requirePageAuth(ctx, ['SUPER_ADMIN', 'OPS_ADMIN'], async () => {
    const q = typeof ctx.query.q === 'string' ? ctx.query.q.trim() : '';
    const role = ROLES.includes(ctx.query.role as UserRole) ? (ctx.query.role as UserRole) : undefined;
    const page = Math.max(1, parseInt(String(ctx.query.page || '1')) || 1);
    const where: Prisma.UserWhereInput = {
      ...(role ? { role } : {}),
      ...(q ? { OR: [{ email: { contains: q, mode: 'insensitive' } }, { firstName: { contains: q, mode: 'insensitive' } }, { lastName: { contains: q, mode: 'insensitive' } }] } : {}),
    };
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true, createdAt: true, lastLogin: true } }),
      prisma.user.count({ where }),
    ]);
    return { users, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)), total };
  });

export default function AdminUsers({ users, page, pages, total }: any) {
  const router = useRouter();
  const toast = useToast();
  const { user: me } = useAuth();
  const [q, setQ] = useState((router.query.q as string) || '');
  const [pending, setPending] = useState<string | null>(null);

  const setStatus = async (id: string, status: 'ACTIVE' | 'SUSPENDED') => {
    setPending(id);
    try {
      await api(`/api/admin/users/${id}`, { method: 'PATCH', body: { status } });
      toast('success', status === 'SUSPENDED' ? 'User suspended and signed out' : 'User reactivated');
      router.replace(router.asPath, undefined, { scroll: false });
    } catch (err) {
      toast('error', (err as ApiError).message);
    } finally {
      setPending(null);
    }
  };

  return (
    <DashboardLayout title="Users" description={`${total} accounts`}>
      <form
        className="mb-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          router.push({ pathname: '/admin/users', query: { ...(q ? { q } : {}), ...(router.query.role ? { role: router.query.role } : {}) } });
        }}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <Input aria-label="Search users" placeholder="Name or email" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <div className="sm:w-48">
          <Select aria-label="Role" value={(router.query.role as string) || ''} onChange={(e) => router.push({ pathname: '/admin/users', query: { ...(router.query.q ? { q: router.query.q } : {}), ...(e.target.value ? { role: e.target.value } : {}) } })}>
            <option value="">All roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </Select>
        </div>
        <Button type="submit" variant="outline">Search</Button>
      </form>
      {users.length === 0 ? (
        <EmptyState title="No users found" description="Try a different search." />
      ) : (
        <Card>
          <Table>
            <thead><tr><Th>User</Th><Th>Role</Th><Th>Joined</Th><Th>Last login</Th><Th>Status</Th><Th className="text-right">Action</Th></tr></thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id}>
                  <Td><p className="font-medium text-ink">{fullName(u)}</p><p className="text-xs text-slate-600">{u.email}</p></Td>
                  <Td>{ROLE_LABEL[u.role]}</Td>
                  <Td>{formatDate(u.createdAt)}</Td>
                  <Td>{u.lastLogin ? formatDate(u.lastLogin, true) : '—'}</Td>
                  <Td><Badge tone={u.status === 'ACTIVE' ? 'success' : 'danger'}>{u.status.toLowerCase()}</Badge></Td>
                  <Td className="text-right">
                    {u.id !== me?.id && (u.status === 'ACTIVE' ? (
                      <Button size="sm" variant="outline" loading={pending === u.id} onClick={() => setStatus(u.id, 'SUSPENDED')}>Suspend</Button>
                    ) : u.status === 'SUSPENDED' ? (
                      <Button size="sm" variant="outline" loading={pending === u.id} onClick={() => setStatus(u.id, 'ACTIVE')}>Reactivate</Button>
                    ) : null)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
      <Pagination page={page} pages={pages} />
    </DashboardLayout>
  );
}
