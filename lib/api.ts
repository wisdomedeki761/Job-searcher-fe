/** API base URL — point at the Go backend. */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/* ---------------- types (mirror Go models) ---------------- */

export interface Job {
  id: string;
  search_config_id: string;
  source: string;
  source_post_id: string;
  source_url: string;
  job_title: string;
  company_name: string;
  location: string;
  employment_type: string;
  work_mode: string;
  description: string;
  application_url: string;
  posted_at?: string;
  first_seen_at: string;
  last_seen_at: string;
  classification_method: string;
  ai_confidence?: number;
  created_at: string;
  updated_at: string;
}

export interface SearchConfig {
  id: string;
  job_type: string;
  cron_expression: string;
  timezone: string;
  enabled: boolean;
  keywords: string[];
  exclude_keywords: string[];
  locations: string[];
  employment_type: string;
  work_mode: string;
  sources: string[];
  lookback_hours: number;
  ai_generated: boolean;
  last_run_at?: string;
  next_run_at?: string;
  created_at: string;
  updated_at: string;
  running?: boolean; // annotated by admin list endpoint
}

export interface SearchRun {
  id: string;
  search_config_id: string;
  source: string;
  started_at: string;
  finished_at?: string;
  status: string;
  raw_count: number;
  new_jobs_count: number;
  duplicate_count: number;
  rejected_count: number;
  error?: string;
}

export interface AIProfile {
  keywords: string[];
  exclude_keywords: string[];
  locations: string[];
  employment_type: string;
  work_mode: string;
  sources: string[];
  lookback_hours: number;
  suggested_cron: string;
}

export interface JobFilter {
  q?: string;
  location?: string;
  work_mode?: string;
  employment_type?: string;
  source?: string;
  limit?: number;
  offset?: number;
}

/* ---------------- helpers ---------------- */

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

/** Like handle(), but guarantees an array even when the API returns null. */
async function handleList<T>(res: Response): Promise<T[]> {
  const data = await handle<T[] | null>(res);
  return data ?? [];
}

function qs(params: object): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/* ---------------- authenticated API (login required) ---------------- */

async function authedFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
    cache: "no-store",
  });
  return handle<T>(res);
}

export async function fetchJobs(filter: JobFilter): Promise<Job[]> {
  const data = await authedFetch<Job[] | null>(`/api/jobs${qs(filter)}`);
  return data ?? [];
}

export async function fetchJob(id: string): Promise<Job> {
  return authedFetch<Job>(`/api/jobs/${id}`);
}

export async function fetchSources(): Promise<{ sources: string[]; ai: boolean }> {
  return authedFetch<{ sources: string[]; ai: boolean }>("/api/sources");
}

/* ---------------- auth ---------------- */

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: string; // "super_admin" | "user"
  can_manage_configs: boolean;
  last_login_at?: string;
}

/** Result of create-user / reset-password (super admin only). */
export interface CredentialsResult {
  admin: Admin;
  emailed: boolean;
  password?: string; // present only when the email could not be sent
  message: string;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await handle<{ token: string; expires_at: string; admin: Admin }>(res);
  if (typeof window !== "undefined") {
    localStorage.setItem("qx_token", data.token);
    localStorage.setItem("qx_admin", JSON.stringify(data.admin));
  }
  return data;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("qx_token");
}

/** Cached account from login / last /me refresh — drives UI permission gating. */
export function getStoredAdmin(): Admin | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("qx_admin");
    return raw ? (JSON.parse(raw) as Admin) : null;
  } catch {
    return null;
  }
}

export function storeAdmin(a: Admin) {
  if (typeof window !== "undefined") {
    localStorage.setItem("qx_admin", JSON.stringify(a));
  }
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("qx_token");
    localStorage.removeItem("qx_admin");
  }
}

export async function fetchMe(): Promise<Admin> {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const me = await handle<Admin>(res);
  storeAdmin(me); // refresh cached permissions
  return me;
}

/* ---------------- admin API ---------------- */

async function adminFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}/api/admin${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  return handle<T>(res);
}

/** Like adminFetch, but guarantees an array even when the API returns null. */
async function adminFetchList<T>(path: string): Promise<T[]> {
  const res = await fetch(`${API_BASE}/api/admin${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    cache: "no-store",
  });
  return handleList<T>(res);
}

export const admin = {
  listConfigs: () => adminFetchList<SearchConfig>("/search-configs"),
  getConfig: (id: string) => adminFetch<SearchConfig>(`/search-configs/${id}`),
  createConfig: (body: unknown) =>
    adminFetch<SearchConfig>("/search-configs", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateConfig: (id: string, body: unknown) =>
    adminFetch<SearchConfig>(`/search-configs/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteConfig: (id: string) =>
    adminFetch(`/search-configs/${id}`, { method: "DELETE" }),
  enableConfig: (id: string) =>
    adminFetch(`/search-configs/${id}/enable`, { method: "POST" }),
  disableConfig: (id: string) =>
    adminFetch(`/search-configs/${id}/disable`, { method: "POST" }),
  runConfig: (id: string) =>
    adminFetch(`/search-configs/${id}/run`, { method: "POST" }),
  configRuns: (id: string) =>
    adminFetchList<SearchRun>(`/search-configs/${id}/runs`),
  allRuns: () => adminFetchList<SearchRun>("/runs"),
  enrich: (job_type: string) =>
    adminFetch<AIProfile>("/search-configs/enrich", {
      method: "POST",
      body: JSON.stringify({ job_type }),
    }),

  /* account self-service (any logged-in user) */
  updateProfile: (body: { email?: string; name?: string }) =>
    adminFetch<Admin>("/profile", { method: "PUT", body: JSON.stringify(body) }),
  changePassword: (body: { current_password: string; new_password: string }) =>
    adminFetch<{ status: string }>("/profile/password", {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  /* user management (super admin only) */
  listUsers: () => adminFetchList<Admin>("/users"),
  createUser: (body: { email: string; name?: string; can_manage_configs: boolean }) =>
    adminFetch<CredentialsResult>("/users", { method: "POST", body: JSON.stringify(body) }),
  updateUser: (
    id: string,
    body: { email?: string; name?: string; can_manage_configs?: boolean },
  ) => adminFetch<Admin>(`/users/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteUser: (id: string) =>
    adminFetch<{ status: string }>(`/users/${id}`, { method: "DELETE" }),
  resetUserPassword: (id: string) =>
    adminFetch<CredentialsResult>(`/users/${id}/reset-password`, { method: "POST" }),
};
