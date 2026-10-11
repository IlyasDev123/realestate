import {
  ApiUser, ApiAgent, ApiProperty, ApiLead, ApiClient, ApiDeal,
  ApiNotification, ApiSetting, ApiStats, ApiMonthStat, PaginatedResponse,
  NotificationsListResponse,
  RegisterPayload, LoginPayload, PropertyPayload, SubmitLeadPayload,
  UpdateLeadPayload, ClientPayload, DealPayload, UpdateProfilePayload,
  AdminCreateUserPayload, CreateLeadPayload, ApiAgentDossier,
} from './api-types';

// Server-side: call the backend directly (no CORS). Client-side: route through
// the Next.js reverse proxy at /api/proxy so the browser never hits the external
// origin directly, which eliminates CORS errors entirely.
const API_BASE =
  typeof window === 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1')
    : '/api/proxy';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

// ── In-memory GET cache (20s TTL) ─────────────────────────────────────────────
// Navigating between dashboard pages re-uses cached responses so each page
// feels instant instead of re-fetching data the user just saw.
const getCache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 300_000; // 5 minutes

function cacheGet<T>(key: string): T | null {
  const hit = getCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.data as T;
  return null;
}

function cacheSet(key: string, data: unknown): void {
  getCache.set(key, { data, expires: Date.now() + CACHE_TTL });
}

export function invalidateCache(pathFragment?: string): void {
  if (!pathFragment) { getCache.clear(); return; }
  for (const key of getCache.keys()) {
    if (key.includes(pathFragment)) getCache.delete(key);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('haven_token');
}

function buildQs(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return '';
  const filtered = Object.fromEntries(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)])
  );
  const qs = new URLSearchParams(filtered).toString();
  return qs ? `?${qs}` : '';
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  formData?: FormData,
): Promise<T> {
  const isGet = method === 'GET';

  if (isGet) {
    const cached = cacheGet<T>(path);
    if (cached !== null) return cached;
  }

  const token = getToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body && !formData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: formData ?? (body ? JSON.stringify(body) : undefined),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(res.status, payload.message ?? 'Request failed', payload.errors);
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json() as T;

  if (isGet) cacheSet(path, data);

  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: RegisterPayload) =>
    request<{ message: string; user: ApiUser }>('POST', '/auth/register', data),

  login: (data: LoginPayload) =>
    request<{ token: string; token_type: string; user: ApiUser }>('POST', '/auth/login', data),

  logout: () => request<{ message: string }>('POST', '/auth/logout'),

  me: () => request<ApiUser>('GET', '/auth/user'),
};

// ── Properties ────────────────────────────────────────────────────────────────
export const propertiesApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    request<PaginatedResponse<ApiProperty>>('GET', `/properties${buildQs(params)}`),

  get: (id: string) =>
    request<{ data: ApiProperty }>('GET', `/properties/${id}`),

  create: async (data: PropertyPayload) => {
    const res = await request<{ data: ApiProperty }>('POST', '/properties', data);
    invalidateCache('/properties');
    return res;
  },

  createWithImages: async (data: PropertyPayload, images: File[]) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (Array.isArray(v)) {
        v.forEach((item) => fd.append(`${k}[]`, String(item)));
      } else if (typeof v === 'boolean') {
        fd.append(k, v ? '1' : '0');
      } else {
        fd.append(k, String(v));
      }
    });
    images.forEach((img) => fd.append('images[]', img));
    const res = await request<{ data: ApiProperty }>('POST', '/properties', undefined, fd);
    invalidateCache('/properties');
    return res;
  },

  update: async (id: string, data: Partial<PropertyPayload>) => {
    const res = await request<{ data: ApiProperty }>('PUT', `/properties/${id}`, data);
    invalidateCache('/properties');
    return res;
  },

  delete: async (id: string) => {
    const res = await request<{ message: string }>('DELETE', `/properties/${id}`);
    invalidateCache('/properties');
    return res;
  },

  uploadImages: (propertyId: string, images: File[]) => {
    const fd = new FormData();
    images.forEach((img) => fd.append('images[]', img));
    return request<unknown>('POST', `/properties/${propertyId}/images`, undefined, fd);
  },

  deleteImage: (propertyId: string, imageId: string) =>
    request<{ message: string }>('DELETE', `/properties/${propertyId}/images/${imageId}`),
};

// ── Leads ─────────────────────────────────────────────────────────────────────
export const leadsApi = {
  submit: (data: SubmitLeadPayload) =>
    request<{ data: ApiLead }>('POST', '/leads', data),

  create: async (data: CreateLeadPayload) => {
    const res = await request<{ data: ApiLead }>('POST', '/leads/manual', data);
    invalidateCache('/leads');
    return res;
  },

  list: (params?: Record<string, string | number | undefined>) =>
    request<PaginatedResponse<ApiLead>>('GET', `/leads${buildQs(params)}`),

  get: (id: string) =>
    request<{ data: ApiLead }>('GET', `/leads/${id}`),

  update: async (id: string, data: UpdateLeadPayload) => {
    const res = await request<{ data: ApiLead }>('PUT', `/leads/${id}`, data);
    invalidateCache('/leads');
    return res;
  },

  delete: async (id: string) => {
    const res = await request<{ message: string }>('DELETE', `/leads/${id}`);
    invalidateCache('/leads');
    return res;
  },
};

// ── Clients ───────────────────────────────────────────────────────────────────
export const clientsApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    request<PaginatedResponse<ApiClient>>('GET', `/clients${buildQs(params)}`),

  get: (id: string) =>
    request<{ data: ApiClient }>('GET', `/clients/${id}`),

  create: async (data: ClientPayload) => {
    const res = await request<{ data: ApiClient }>('POST', '/clients', data);
    invalidateCache('/clients');
    return res;
  },

  update: async (id: string, data: Partial<ClientPayload>) => {
    const res = await request<{ data: ApiClient }>('PUT', `/clients/${id}`, data);
    invalidateCache('/clients');
    return res;
  },

  delete: async (id: string) => {
    const res = await request<{ message: string }>('DELETE', `/clients/${id}`);
    invalidateCache('/clients');
    return res;
  },
};

// ── Deals ─────────────────────────────────────────────────────────────────────
export const dealsApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    request<PaginatedResponse<ApiDeal>>('GET', `/deals${buildQs(params)}`),

  get: (id: string) =>
    request<{ data: ApiDeal }>('GET', `/deals/${id}`),

  create: async (data: DealPayload) => {
    const res = await request<{ data: ApiDeal }>('POST', '/deals', data);
    invalidateCache('/deals');
    return res;
  },

  update: async (id: string, data: Partial<DealPayload>) => {
    const res = await request<{ data: ApiDeal }>('PUT', `/deals/${id}`, data);
    invalidateCache('/deals');
    return res;
  },

  delete: async (id: string) => {
    const res = await request<{ message: string }>('DELETE', `/deals/${id}`);
    invalidateCache('/deals');
    return res;
  },
};

// ── Agents (public) ───────────────────────────────────────────────────────────
export const statsApi = {
  get: () => request<{ data: ApiStats }>('GET', '/stats'),
  charts: (range: string) =>
    request<{ data: { range: string; deals_by_month: ApiMonthStat[]; leads_by_month: ApiMonthStat[] } }>(
      'GET', `/stats/charts?range=${range}`
    ),
};

export const agentsApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    request<PaginatedResponse<ApiAgent>>('GET', `/agents${buildQs(params)}`),

  get: (id: string) =>
    request<{ data: ApiAgent }>('GET', `/agents/${id}`),

  dossier: (agentId: string) =>
    request<{ data: ApiAgentDossier }>('GET', `/admin/agents/${agentId}/dossier`),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: (params?: { page?: number; per_page?: number; unread?: boolean }) =>
    request<NotificationsListResponse>('GET', `/notifications${buildQs(params)}`),

  markRead: (id: string) =>
    request<{ message: string }>('POST', `/notifications/${id}/read`),

  markAllRead: () =>
    request<{ message: string }>('POST', '/notifications/read-all'),
};

// ── Settings ──────────────────────────────────────────────────────────────────
export const settingsApi = {
  get: () =>
    request<{ data: ApiSetting }>('GET', '/settings'),

  update: (data: Partial<ApiSetting>) =>
    request<{ data: ApiSetting }>('PUT', '/settings', data),
};

// ── Profile ───────────────────────────────────────────────────────────────────
export const profileApi = {
  update: (data: UpdateProfilePayload) =>
    request<{ data: ApiUser }>('PUT', '/profile', data),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  pendingAgents: (page = 1) =>
    request<PaginatedResponse<ApiAgent>>('GET', `/admin/agent-applications?page=${page}`),

  approveAgent: (agentId: string) =>
    request<{ data: ApiAgent }>('POST', `/admin/agent-applications/${agentId}/approve`),

  rejectAgent: (agentId: string, reason: string) =>
    request<{ data: ApiAgent }>('POST', `/admin/agent-applications/${agentId}/reject`, { reason }),

  // User management
  listUsers: (params?: Record<string, string | number | undefined>) =>
    request<PaginatedResponse<ApiUser>>('GET', `/admin/users${buildQs(params)}`),

  createUser: async (data: AdminCreateUserPayload) => {
    const res = await request<{ data: ApiUser }>('POST', '/admin/users', data);
    invalidateCache('/admin/users');
    return res;
  },

  deleteUser: async (userId: string) => {
    const res = await request<{ message: string }>('DELETE', `/admin/users/${userId}`);
    invalidateCache('/admin/users');
    return res;
  },
};
