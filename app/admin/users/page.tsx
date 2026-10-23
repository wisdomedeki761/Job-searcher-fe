"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Alert from "@/components/Alert";
import BottomNav from "@/components/BottomNav";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageShell from "@/components/PageShell";
import Toast from "@/components/Toast";
import TopBar from "@/components/TopBar";
import {
  IconBriefcase,
  IconGauge,
  IconKey,
  IconRefresh,
  IconTrash,
  IconUser,
  IconUsers,
} from "@/components/icons";
import {
  admin,
  fetchMe,
  getStoredAdmin,
  getToken,
  logout,
  type Admin,
  type CredentialsResult,
} from "@/lib/api";
import { timeAgo } from "@/lib/format";

/** Initials for the account avatar tile. */
function initials(a: Admin): string {
  const src = (a.name || a.email || "?").trim();
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").toUpperCase() + (parts[1]?.[0] ?? "");
}

/**
 * User management (super admin only). Create an account by entering the
 * person's email — the backend generates a password and emails it to them in
 * HTML. The "search configs" permission decides whether they can manage
 * configs or only view the job feed.
 */
export default function UsersPage() {
  const router = useRouter();
  const [me, setMe] = useState<Admin | null>(null);
  const [users, setUsers] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create-user form
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [canManage, setCanManage] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Credentials result panel (create or password reset)
  const [credentials, setCredentials] = useState<CredentialsResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Confirmation dialogs (delete user / new password)
  const [confirmDelete, setConfirmDelete] = useState<Admin | null>(null);
  const [confirmReset, setConfirmReset] = useState<Admin | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tone: "success" | "danger"; msg: string } | null>(null);

  const showToast = (msg: string, tone: "success" | "danger" = "success") => {
    setToast({ tone, msg });
    setTimeout(() => setToast(null), 2500);
  };

  const refresh = useCallback(async () => {
    try {
      const [current, list] = await Promise.all([fetchMe(), admin.listUsers()]);
      if (current.role !== "super_admin") {
        router.replace("/"); // not allowed here
        return;
      }
      setMe(current);
      setUsers(list);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load";
      if (/401|unauthor/i.test(msg)) {
        logout();
        router.replace("/login");
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    const cached = getStoredAdmin();
    if (cached && cached.role !== "super_admin") {
      router.replace("/");
      return;
    }
    refresh();
  }, [router, refresh]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    setCredentials(null);
    try {
      const res = await admin.createUser({
        email: newEmail.trim(),
        name: newName.trim(),
        can_manage_configs: canManage,
      });
      setCredentials(res);
      setNewEmail("");
      setNewName("");
      showToast(
        res.password
          ? "Account created — the password is shown below."
          : `Login details emailed to ${res.admin.email}.`,
      );
      await refresh();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  async function togglePerms(user: Admin) {
    setBusyId(user.id);
    try {
      const updated = await admin.updateUser(user.id, {
        can_manage_configs: !user.can_manage_configs,
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showToast("Config access updated.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Update failed", "danger");
    } finally {
      setBusyId(null);
    }
  }

  async function resetPassword(user: Admin) {
    setConfirmReset(user);
  }

  async function confirmResetPassword() {
    const user = confirmReset;
    if (!user) return;
    setBusyId(user.id);
    setCredentials(null);
    setConfirmReset(null);
    try {
      const res = await admin.resetUserPassword(user.id);
      setCredentials(res);
      showToast(
        res.password
          ? "SMTP is not configured — the new password is shown below."
          : `Login details emailed to ${user.email}.`,
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Couldn't reset this password. Please try again.",
        "danger",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function remove(user: Admin) {
    setConfirmDelete(user);
  }

  async function confirmRemove() {
    const user = confirmDelete;
    if (!user) return;
    setBusyId(user.id);
    setConfirmDelete(null);
    try {
      await admin.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showToast(`${user.name || user.email}’s account was deleted.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed", "danger");
    } finally {
      setBusyId(null);
    }
  }

  function copyPassword(pw: string) {
    navigator.clipboard?.writeText(pw).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <PageShell>
      <TopBar title="Users" backHref="/admin" />

      {/* Hero */}
      <div>
        <h1 className="text-[32px] font-semibold leading-tight text-ink">
          Good work starts with the right people.
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Create accounts, control config access, and keep the workspace moving.
        </p>
      </div>

      {/* Rail (create) + accounts */}
      <div className="grid gap-6 lg:grid-cols-[480px_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-4">
          {/* Create user */}
          <form onSubmit={createUser} className="card flex flex-col gap-[22px] p-7">
            <div>
              <h2 className="text-xl font-semibold text-ink">Create user</h2>
              <p className="mt-1 text-sm text-muted">
                Enter their email — the backend generates a password and emails it
                to them automatically.
              </p>
            </div>

            <div className={`grid gap-4 sm:grid-cols-2 ${creating ? "opacity-50" : ""}`}>
              <div>
                <label htmlFor="newEmail" className="label">
                  Email address *
                </label>
                <input
                  id="newEmail"
                  type="email"
                  required
                  disabled={creating}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="person@example.com"
                  className="field mt-2"
                />
              </div>
              <div>
                <label htmlFor="newName" className="label">
                  Name
                </label>
                <input
                  id="newName"
                  disabled={creating}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Jane Doe"
                  className="field mt-2"
                />
              </div>
            </div>

            <label className={`flex cursor-pointer items-center justify-between gap-4 ${creating ? "opacity-50" : ""}`}>
              <span className="text-sm font-medium text-ink">
                Can create &amp; manage search configs
                <span className="mt-0.5 block text-[11px] font-normal text-muted">
                  Off = can only view the job feed
                </span>
              </span>
              <input
                type="checkbox"
                disabled={creating}
                checked={canManage}
                onChange={(e) => setCanManage(e.target.checked)}
                className="switch"
              />
            </label>

            {createError && <Alert>{createError}</Alert>}

            <button type="submit" disabled={creating} className="btn-primary w-full">
              {creating && <IconRefresh className="h-4 w-4 animate-spin" />}
              {creating ? "Creating…" : "Create account & email password"}
            </button>
          </form>

          {/* Credentials result (create / reset) */}
          {credentials && (
            <div className="panel-success flex flex-col gap-4 p-6">
              <Alert tone="success">{credentials.message}</Alert>
              {credentials.password ? (
                <>
                  <div className="flex items-center gap-3 rounded-xl bg-field p-3.5">
                    <code className="min-w-0 flex-1 select-all break-all font-mono text-lg font-semibold text-accent">
                      {credentials.password}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyPassword(credentials.password!)}
                      className="btn-ghost shrink-0"
                    >
                      {copied ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted">
                    Share this with the user — it is shown only once.
                  </p>
                </>
              ) : (
                <p className="text-[11px] text-muted">
                  The temporary password was emailed to {credentials.admin.email}.
                </p>
              )}
            </div>
          )}
        </div>

        {/* User list */}
        <section className="flex flex-col gap-[18px]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-ink">All accounts</h2>
            <span className="chip">
              {users.length} member{users.length === 1 ? "" : "s"}
            </span>
          </div>

          {loading ? (
            /* ACCOUNTS · LOADING — two 112px skeletons */
            <div className="flex flex-col gap-4">
              <div className="card flex h-28 flex-col items-start gap-3.5 p-5">
                <div className="skeleton h-4 w-full shrink-0 rounded-[5px]" />
                <div className="skeleton h-3 w-[140px] shrink-0 rounded-[5px]" />
                <div className="skeleton h-3 w-[100px] shrink-0 rounded-[5px]" />
              </div>
              <div className="card flex h-28 flex-col items-start gap-3.5 p-5">
                <div className="skeleton h-4 w-full shrink-0 rounded-[5px]" />
                <div className="skeleton h-3 w-[140px] shrink-0 rounded-[5px]" />
                <div className="skeleton h-3 w-[100px] shrink-0 rounded-[5px]" />
              </div>
            </div>
          ) : error ? (
            /* ACCOUNTS · ERROR */
            <div className="card flex flex-col items-start gap-5 p-6">
              <p className="text-[22px] font-semibold text-danger">
                Couldn&apos;t load accounts
              </p>
              <p className="text-sm text-muted">
                Please try again. Existing accounts and permissions have not
                changed.
              </p>
              <button type="button" onClick={refresh} className="btn-ghost">
                <IconRefresh className="h-4 w-4 text-accent" /> Retry
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="card p-6 text-center text-sm text-muted">
              No accounts yet.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {users.map((u) => {
                const isSelf = u.id === me?.id;
                return (
                  <div key={u.id} className="card flex flex-col gap-4 p-6">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-accent-soft text-[13px] font-semibold text-accent">
                        {initials(u)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold text-ink">
                          {u.name || "—"}
                        </p>
                        <p className="truncate text-xs text-muted">{u.email}</p>
                      </div>
                      {u.role === "super_admin" ? (
                        <span className="chip chip-accent shrink-0">Super admin</span>
                      ) : (
                        <span
                          className={`chip shrink-0 capitalize ${
                            u.can_manage_configs ? "chip-success" : ""
                          }`}
                        >
                          {u.can_manage_configs ? "Manager" : "View only"}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {u.role !== "super_admin" && (
                        <button
                          type="button"
                          onClick={() => togglePerms(u)}
                          disabled={busyId === u.id}
                          className={`min-w-36 flex-1 disabled:opacity-60 ${
                            u.can_manage_configs ? "btn-success" : "btn-ghost"
                          }`}
                        >
                          {u.can_manage_configs
                            ? "Config access: ON"
                            : "Config access: OFF"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => resetPassword(u)}
                        disabled={busyId === u.id}
                        className="btn-ghost min-w-32 flex-1 gap-1.5 disabled:opacity-60"
                      >
                        <IconKey className="h-4 w-4" /> New password
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(u)}
                        disabled={busyId === u.id || isSelf}
                        className="icon-btn-danger disabled:opacity-35"
                        aria-label={`Delete ${u.email}`}
                        title={
                          isSelf ? "You cannot delete your own account" : "Delete account"
                        }
                      >
                        <IconTrash />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-muted">
                      {u.last_login_at ? (
                        <span>Last sign-in {timeAgo(u.last_login_at)}</span>
                      ) : (
                        <span>Never signed in</span>
                      )}
                      {isSelf && (
                        <>
                          <span>·</span>
                          <span>Your account cannot be deleted.</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Action toasts — short-lived feedback */}
      {toast && (
        <Toast tone={toast.tone}>{toast.msg}</Toast>
      )}

      {/* CONFIRM · DELETE USER */}
      <ConfirmDialog
        open={confirmDelete !== null}
        tone="danger"
        icon={<IconTrash className="h-6 w-6" />}
        title="Delete this account?"
        body={`${confirmDelete?.name || confirmDelete?.email || ""} (${confirmDelete?.email ?? ""}) will lose access to QX Scraper. This action cannot be undone.`}
        confirmLabel="Delete account"
        busy={busyId !== null}
        onConfirm={confirmRemove}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* CONFIRM · NEW PASSWORD */}
      <ConfirmDialog
        open={confirmReset !== null}
        tone="accent"
        icon={<IconKey className="h-6 w-6" />}
        title="Generate a new password?"
        body={`A new temporary password will be generated for ${confirmReset?.name || confirmReset?.email || ""} (${confirmReset?.email ?? ""}) and emailed to them. Their current password will stop working.`}
        confirmLabel="Reset & email password"
        busy={busyId !== null}
        onConfirm={confirmResetPassword}
        onCancel={() => setConfirmReset(null)}
      />

      <BottomNav
        items={[
          { href: "/", label: "Jobs", icon: <IconBriefcase /> },
          { href: "/admin", label: "Admin", icon: <IconGauge /> },
          { href: "/admin/users", label: "Users", icon: <IconUsers />, active: true },
          { href: "/admin/profile", label: "Account", icon: <IconUser /> },
        ]}
      />
    </PageShell>
  );
}
