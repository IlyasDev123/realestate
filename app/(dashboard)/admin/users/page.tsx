'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Users, Search, PlusCircle, UserCog,
  ChevronLeft, ChevronRight, LayoutGrid, List, AlertTriangle, X, Trash2,
} from 'lucide-react';
import { adminApi, ApiError } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { ApiUser } from '@/lib/api-types';
import { UserCard, UserAvatar, RoleBadge, AgentStatusBadge } from '@/components/dashboard/UserCard';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // KPI totals (accurate, loaded once on mount)
  const [agentTotal, setAgentTotal] = useState<number | null>(null);
  const [managerTotal, setManagerTotal] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [roleFilter, setRoleFilter] = useState<'all' | 'agent' | 'manager'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ApiUser | null>(null);

  const toast = useToast();

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = { page: p, per_page: 12 };
      if (roleFilter !== 'all') params.role = roleFilter;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const res = await adminApi.listUsers(params);
      setUsers(res.data);
      setPage(res.meta.current_page);
      setLastPage(res.meta.last_page);
      setTotal(res.meta.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter]);

  useEffect(() => { load(1); }, [load]);

  // Load accurate KPI totals once on mount
  useEffect(() => {
    adminApi.listUsers({ role: 'agent', per_page: 1 })
      .then((r) => setAgentTotal(r.meta.total))
      .catch(() => {});
    adminApi.listUsers({ role: 'manager', per_page: 1 })
      .then((r) => setManagerTotal(r.meta.total))
      .catch(() => {});
  }, []);

  async function handleDelete(user: ApiUser) {
    setDeleting(user.id);
    try {
      await adminApi.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setTotal((t) => Math.max(0, t - 1));
      if (user.role === 'agent') setAgentTotal((t) => t !== null ? Math.max(0, t - 1) : null);
      if (user.role === 'manager') setManagerTotal((t) => t !== null ? Math.max(0, t - 1) : null);
      setConfirmDelete(null);
      toast('User removed successfully');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Error deleting user', 'error');
    } finally {
      setDeleting(null);
    }
  }

  const hasFilters = search !== '' || roleFilter !== 'all';
  function clearFilters() {
    setSearch('');
    setDebouncedSearch('');
    setRoleFilter('all');
  }

  function renderPageButtons(): (number | '...')[] {
    const pages: (number | '...')[] = [];
    if (lastPage <= 7) {
      for (let i = 1; i <= lastPage; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(lastPage - 1, page + 1); i++) pages.push(i);
      if (page < lastPage - 2) pages.push('...');
      pages.push(lastPage);
    }
    return pages;
  }

  const kpis = [
    {
      label: 'Total Users',
      value: total,
      sub: 'All roles combined',
      icon: Users,
      color: 'text-secondary',
    },
    {
      label: 'Total Agents',
      value: agentTotal ?? '—',
      sub: 'Advisory partners',
      icon: Users,
      color: 'text-emerald-600',
    },
    {
      label: 'Total Managers',
      value: managerTotal ?? '—',
      sub: 'Office managers',
      icon: UserCog,
      color: 'text-secondary',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <span className="font-semibold uppercase tracking-wider">RMS Enterprise</span>
        <span className="text-outline-variant">/</span>
        <span className="font-semibold text-secondary uppercase tracking-wider">Users</span>
        <div className="flex items-center gap-1.5 ml-3 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
          <span className="text-xs font-medium">{total} Total Users</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-on-surface font-display">User Management</h1>
          <p className="text-sm text-on-surface-variant mt-1">Add and manage agent and manager accounts directly.</p>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-on-secondary text-sm font-semibold shadow-md hover:opacity-90 transition-all whitespace-nowrap w-fit"
        >
          <PlusCircle size={16} />
          Add User
        </Link>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="p-4 rounded-xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between min-h-[100px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{kpi.label}</span>
              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center">
                <kpi.icon size={16} className={kpi.color} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-on-surface leading-none font-display">{kpi.value}</span>
              <span className="text-xs font-medium text-on-surface-variant">{kpi.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter + Search toolbar */}
      <div className="p-3 rounded-xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Role tabs */}
        <div className="flex items-center bg-surface-container-low p-1 rounded-lg gap-0.5 shrink-0">
          {(['all', 'agent', 'manager'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
                roleFilter === r
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {r === 'all'
                ? `All Users`
                : r === 'agent'
                ? `Agents${agentTotal !== null ? ` (${agentTotal})` : ''}`
                : `Managers${managerTotal !== null ? ` (${managerTotal})` : ''}`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2 bg-surface-container-low rounded-lg text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:bg-surface-container transition-all"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-on-surface-variant hover:text-on-surface bg-surface-container-low hover:bg-surface-container rounded-lg transition-colors"
            >
              <X size={13} />
              Clear
            </button>
          )}
          {/* View toggle */}
          <div className="flex items-center bg-surface-container-low p-1 rounded-lg gap-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'table' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] rounded-xl flex items-center justify-center h-48">
          <div className="w-7 h-7 border-2 border-outline-variant border-t-secondary rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-surface-container-lowest rounded-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="w-14 h-14 rounded-full bg-surface-container-low flex items-center justify-center mb-3">
            <Users size={24} className="text-on-surface-variant" />
          </div>
          <p className="text-sm font-semibold text-on-surface">No users found</p>
          <p className="text-xs text-on-surface-variant mt-1">Try adjusting your filters or add a new user.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onDelete={(id) => setConfirmDelete(users.find((u) => u.id === id) ?? null)}
              deleting={deleting}
            />
          ))}
        </div>
      ) : (
        <div className="bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low/50 border-b border-outline-variant/20">
                  {['User', 'Email', 'Phone', 'Role', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {users.map((user) => {
                  const roleName = user.role ?? 'agent';
                  return (
                    <tr key={user.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-on-surface">{user.full_name}</p>
                            <p className="text-xs text-on-surface-variant font-mono">ID: {user.id.slice(0, 8)}…</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-on-surface-variant">{user.email}</td>
                      <td className="px-5 py-3.5 text-sm text-on-surface-variant">{user.phone ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        <RoleBadge role={roleName} />
                      </td>
                      <td className="px-5 py-3.5">
                        {roleName === 'agent' && user.agent ? (
                          <AgentStatusBadge status={user.agent.approval_status} />
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {roleName !== 'super_admin' && (
                          <button
                            onClick={() => setConfirmDelete(user)}
                            disabled={deleting === user.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-error-container hover:bg-error/10 text-on-error-container rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={12} />
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-on-surface-variant">
            Page {page} of {lastPage} · {total} total
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => load(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-outline disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {renderPageButtons().map((p, i) =>
              p === '...' ? (
                <span key={`e-${i}`} className="px-2 text-on-surface-variant text-sm">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => load(p as number)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    page === p
                      ? 'bg-secondary text-on-secondary'
                      : 'border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-outline'
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => load(page + 1)}
              disabled={page >= lastPage}
              className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-outline disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl shadow-xl p-6 flex flex-col gap-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-error-container flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-on-error-container" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-on-surface">Remove User</h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  Are you sure you want to remove <span className="font-semibold text-on-surface">{confirmDelete.full_name}</span>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-medium bg-surface-container text-on-surface-variant rounded-lg hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting === confirmDelete.id}
                className="px-4 py-2 text-sm font-semibold bg-error text-on-error rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {deleting === confirmDelete.id ? 'Removing…' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
