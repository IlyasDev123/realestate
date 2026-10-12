'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Users, Search, PlusCircle, UserCog,
  ChevronLeft, ChevronRight, LayoutGrid, List, AlertTriangle,
  X, Trash2, ShieldCheck,
} from 'lucide-react';
import { adminApi, agentsApi, ApiError } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { ApiUser, ApiAgent } from '@/lib/api-types';
import { UserCard, UserAvatar, RoleBadge, AgentStatusBadge } from '@/components/dashboard/UserCard';
import { AgentCard } from '@/components/dashboard/AgentCard';

// ── Helpers ────────────────────────────────────────────────────────────────────
type MainTab = 'users' | 'agents';

export default function AdminUsersPage() {
  const toast = useToast();

  // ── Main tab ─────────────────────────────────────────────────────────────────
  const [mainTab, setMainTab] = useState<MainTab>('users');

  // ── Users tab state ──────────────────────────────────────────────────────────
  const [users, setUsers]       = useState<ApiUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersPage, setUsersPage]       = useState(1);
  const [usersLastPage, setUsersLastPage] = useState(1);
  const [usersTotal, setUsersTotal]     = useState(0);
  const [roleFilter, setRoleFilter]     = useState<'all' | 'manager'>('all');
  const [viewMode, setViewMode]         = useState<'grid' | 'table'>('grid');
  const [deleting, setDeleting]         = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ApiUser | null>(null);

  // ── Agents tab state ─────────────────────────────────────────────────────────
  const [agents, setAgents]         = useState<ApiAgent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [agentsPage, setAgentsPage]       = useState(1);
  const [agentsLastPage, setAgentsLastPage] = useState(1);
  const [agentsTotal, setAgentsTotal]     = useState(0);
  const [agentSearch, setAgentSearch]     = useState('');
  const [agentDebouncedSearch, setAgentDebouncedSearch] = useState('');
  const agentDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Shared search ────────────────────────────────────────────────────────────
  const [search, setSearch]           = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // KPI totals
  const [managerTotal, setManagerTotal] = useState<number | null>(null);

  // Debounce user search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  // Debounce agent search
  useEffect(() => {
    if (agentDebounceRef.current) clearTimeout(agentDebounceRef.current);
    agentDebounceRef.current = setTimeout(() => setAgentDebouncedSearch(agentSearch), 400);
    return () => { if (agentDebounceRef.current) clearTimeout(agentDebounceRef.current); };
  }, [agentSearch]);

  // ── Load users ───────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async (p: number) => {
    setUsersLoading(true);
    try {
      const params: Record<string, string | number | undefined> = { page: p, per_page: 12 };
      if (roleFilter !== 'all') params.role = roleFilter;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const res = await adminApi.listUsers(params);
      setUsers(res.data);
      setUsersPage(res.meta.current_page);
      setUsersLastPage(res.meta.last_page);
      setUsersTotal(res.meta.total);
    } catch {
      // ignore
    } finally {
      setUsersLoading(false);
    }
  }, [debouncedSearch, roleFilter]);

  // ── Load agents ──────────────────────────────────────────────────────────────
  const loadAgents = useCallback(async (p: number) => {
    setAgentsLoading(true);
    try {
      const res = await agentsApi.list({
        page: p,
        per_page: 12,
        search: agentDebouncedSearch || undefined,
      });
      setAgents(res.data);
      setAgentsPage(res.meta.current_page);
      setAgentsLastPage(res.meta.last_page);
      setAgentsTotal(res.meta.total);
    } catch {
      // ignore
    } finally {
      setAgentsLoading(false);
    }
  }, [agentDebouncedSearch]);

  useEffect(() => { loadUsers(1); }, [loadUsers]);

  useEffect(() => {
    if (mainTab === 'agents') loadAgents(1);
  }, [mainTab, loadAgents]);

  // Load KPI totals once
  useEffect(() => {
    adminApi.listUsers({ role: 'manager', per_page: 1 })
      .then((r) => setManagerTotal(r.meta.total))
      .catch(() => {});
  }, []);

  // ── User delete ──────────────────────────────────────────────────────────────
  async function handleDelete(user: ApiUser) {
    setDeleting(user.id);
    try {
      await adminApi.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setUsersTotal((t) => Math.max(0, t - 1));
      if (user.role === 'manager') setManagerTotal((t) => t !== null ? Math.max(0, t - 1) : null);
      setConfirmDelete(null);
      toast('User removed successfully');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Error deleting user', 'error');
    } finally {
      setDeleting(null);
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function renderPageButtons(current: number, last: number): (number | '...')[] {
    const pages: (number | '...')[] = [];
    if (last <= 7) {
      for (let i = 1; i <= last; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      for (let i = Math.max(2, current - 1); i <= Math.min(last - 1, current + 1); i++) pages.push(i);
      if (current < last - 2) pages.push('...');
      pages.push(last);
    }
    return pages;
  }

  const hasUserFilters = search !== '' || roleFilter !== 'all';
  function clearUserFilters() {
    setSearch('');
    setDebouncedSearch('');
    setRoleFilter('all');
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <span className="font-semibold uppercase tracking-wider">RMS Enterprise</span>
        <span className="text-outline-variant">/</span>
        <span className="font-semibold text-secondary uppercase tracking-wider">
          {mainTab === 'users' ? 'User Management' : 'Approved Agents'}
        </span>
        <div className="flex items-center gap-1.5 ml-3 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
          <span className="text-xs font-medium">
            {mainTab === 'users' ? `${usersTotal} Users` : `${agentsTotal} Agents`}
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-on-surface font-display">Manage Users</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {mainTab === 'users'
              ? 'Add and manage manager accounts. Approved agents are shown in the Agents tab.'
              : 'All approved advisory agents. To review pending applications visit Agent Applications.'}
          </p>
        </div>
        {mainTab === 'users' && (
          <Link
            href="/admin/users/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-on-secondary text-sm font-semibold shadow-md hover:opacity-90 transition-all whitespace-nowrap w-fit"
          >
            <PlusCircle size={16} />
            Add User
          </Link>
        )}
      </div>

      {/* ── Main tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl w-fit">
        <button
          onClick={() => setMainTab('users')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            mainTab === 'users'
              ? 'bg-surface-container-lowest text-on-surface shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <UserCog size={15} />
          Users
          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${mainTab === 'users' ? 'bg-secondary/15 text-secondary' : 'bg-surface-container text-on-surface-variant'}`}>
            {usersTotal}
          </span>
        </button>
        <button
          onClick={() => setMainTab('agents')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            mainTab === 'agents'
              ? 'bg-surface-container-lowest text-on-surface shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <ShieldCheck size={15} />
          Agents
          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${mainTab === 'agents' ? 'bg-emerald-500/15 text-emerald-700' : 'bg-surface-container text-on-surface-variant'}`}>
            {agentsTotal || '—'}
          </span>
        </button>
      </div>

      {/* ── KPI strip ──────────────────────────────────────────────────────────── */}
      {mainTab === 'users' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Total Users',    value: usersTotal,       sub: 'All roles',          icon: Users,    color: 'text-secondary',    iconGrad: 'linear-gradient(135deg, #904d00, #fe932c)' },
            { label: 'Total Managers', value: managerTotal ?? '—', sub: 'Office managers', icon: UserCog,  color: 'text-blue-600',     iconGrad: 'linear-gradient(135deg, #1e40af, #3b82f6)' },
          ].map((kpi) => (
            <div key={kpi.label} className="p-4 rounded-xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: kpi.iconGrad }}>
                <kpi.icon size={18} className="text-white" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{kpi.label}</span>
                <p className="text-3xl font-bold text-on-surface font-display leading-tight">{kpi.value}</p>
                <p className="text-xs text-on-surface-variant">{kpi.sub}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Approved Agents',     value: agentsTotal, sub: 'Active advisory partners',    iconGrad: 'linear-gradient(135deg, #047857, #10b981)' },
            { label: 'Total Listings',       value: agents.reduce((s, a) => s + (a.properties_count ?? 0), 0), sub: 'Across visible agents', iconGrad: 'linear-gradient(135deg, #904d00, #fe932c)' },
            { label: 'Closed Deals (page)',  value: agents.reduce((s, a) => s + (a.closed_deals_count ?? 0), 0), sub: 'Completed transactions', iconGrad: 'linear-gradient(135deg, #6d28d9, #8b5cf6)' },
          ].map((kpi) => (
            <div key={kpi.label} className="p-4 rounded-xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: kpi.iconGrad }}>
                <Users size={18} className="text-white" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{kpi.label}</span>
                <p className="text-3xl font-bold text-on-surface font-display leading-tight">{kpi.value}</p>
                <p className="text-xs text-on-surface-variant">{kpi.sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── USERS TAB ────────────────────────────────────────────────────────────── */}
      {mainTab === 'users' && (
        <>
          {/* Filter toolbar */}
          <div className="p-3 rounded-xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Role tabs */}
            <div className="flex items-center bg-surface-container-low p-1 rounded-lg gap-0.5 shrink-0">
              {(['all', 'manager'] as const).map((r) => (
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
                    ? 'All Users'
                    : `Managers${managerTotal !== null ? ` (${managerTotal})` : ''}`}
                </button>
              ))}
            </div>

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
              {hasUserFilters && (
                <button
                  onClick={clearUserFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-on-surface-variant hover:text-on-surface bg-surface-container-low hover:bg-surface-container rounded-lg transition-colors"
                >
                  <X size={13} /> Clear
                </button>
              )}
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

          {usersLoading ? (
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
                          <td className="px-5 py-3.5"><RoleBadge role={roleName} /></td>
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
                                <Trash2 size={12} /> Remove
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

          {usersLastPage > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-on-surface-variant">Page {usersPage} of {usersLastPage} · {usersTotal} total</p>
              <div className="flex items-center gap-1">
                <button onClick={() => loadUsers(usersPage - 1)} disabled={usersPage <= 1}
                  className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-outline disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft size={16} />
                </button>
                {renderPageButtons(usersPage, usersLastPage).map((p, i) =>
                  p === '...' ? (
                    <span key={`e-${i}`} className="px-2 text-on-surface-variant text-sm">…</span>
                  ) : (
                    <button key={p} onClick={() => loadUsers(p as number)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${usersPage === p ? 'bg-secondary text-on-secondary' : 'border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-outline'}`}>
                      {p}
                    </button>
                  )
                )}
                <button onClick={() => loadUsers(usersPage + 1)} disabled={usersPage >= usersLastPage}
                  className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-outline disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── AGENTS TAB ───────────────────────────────────────────────────────────── */}
      {mainTab === 'agents' && (
        <>
          {/* Search + view toggle */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
              <input
                value={agentSearch}
                onChange={(e) => setAgentSearch(e.target.value)}
                placeholder="Search agents by name…"
                className="w-full pl-9 pr-4 py-2 bg-surface-container-low rounded-lg text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:bg-surface-container transition-all"
              />
            </div>
            {agentSearch && (
              <button
                onClick={() => { setAgentSearch(''); setAgentDebouncedSearch(''); }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-on-surface-variant hover:text-on-surface bg-surface-container-low rounded-lg transition-colors"
              >
                <X size={13} /> Clear
              </button>
            )}
            <Link
              href="/admin/agents"
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 text-amber-700 text-xs font-semibold hover:bg-amber-500/15 transition-colors"
            >
              View Pending Applications →
            </Link>
          </div>

          {agentsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-7 h-7 border-2 border-outline-variant border-t-secondary rounded-full animate-spin" />
            </div>
          ) : agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-surface-container-low flex items-center justify-center mb-3">
                <Users size={24} className="text-on-surface-variant/50" />
              </div>
              <p className="text-sm font-semibold text-on-surface">No approved agents found</p>
              <p className="text-xs text-on-surface-variant mt-1">
                {agentSearch ? 'Try a different search term.' : 'Approve agents from the Applications page.'}
              </p>
              <Link href="/admin/agents" className="mt-3 text-sm text-secondary font-medium hover:underline">
                Review pending applications →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}

          {agentsLastPage > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-on-surface-variant">Page {agentsPage} of {agentsLastPage} · {agentsTotal} total</p>
              <div className="flex items-center gap-1">
                <button onClick={() => loadAgents(agentsPage - 1)} disabled={agentsPage <= 1}
                  className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-outline disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft size={16} />
                </button>
                {renderPageButtons(agentsPage, agentsLastPage).map((p, i) =>
                  p === '...' ? (
                    <span key={`e-${i}`} className="px-2 text-on-surface-variant text-sm">…</span>
                  ) : (
                    <button key={p} onClick={() => loadAgents(p as number)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${agentsPage === p ? 'bg-secondary text-on-secondary' : 'border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-outline'}`}>
                      {p}
                    </button>
                  )
                )}
                <button onClick={() => loadAgents(agentsPage + 1)} disabled={agentsPage >= agentsLastPage}
                  className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-outline disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
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
                  Are you sure you want to remove <span className="font-semibold text-on-surface">{confirmDelete.full_name}</span>? This cannot be undone.
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
