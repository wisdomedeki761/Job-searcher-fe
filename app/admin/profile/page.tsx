"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/Alert";
import BottomNav from "@/components/BottomNav";
import PageShell from "@/components/PageShell";
import TopBar from "@/components/TopBar";
import {
  IconBriefcase,
  IconGauge,
  IconKey,
  IconRefresh,
  IconUser,
} from "@/components/icons";
import {
  admin,
  fetchMe,
  getStoredAdmin,
  getToken,
  logout,
  type Admin,
} from "@/lib/api";

/**
 * Account settings — available to EVERY signed-in user. Here they can reset
 * their own display name/email and change their password. This is the page
 * to use after logging in with a super-admin-generated temporary password.
 */
export default function AccountPage() {
  const router = useRouter();
  const [me, setMe] = useState<Admin | null>(null);

  // Profile form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    fetchMe()
      .then((a) => {
        setMe(a);
        setName(a.name ?? "");
        setEmail(a.email);
      })
      .catch(() => setMe(getStoredAdmin()));
  }, [router]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const updated = await admin.updateProfile({ email: email.trim(), name: name.trim() });
      setMe(updated);
      setProfileMsg({ ok: true, text: "Profile saved successfully." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed";
      if (/401|unauthor/i.test(msg)) {
        logout();
        router.replace("/login");
        return;
      }
      setProfileMsg({ ok: false, text: msg });
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: "New passwords do not match." });
      return;
    }
    if (newPw.length < 8) {
      setPwMsg({ ok: false, text: "New password must be at least 8 characters." });
      return;
    }
    setSavingPw(true);
    try {
      await admin.changePassword({ current_password: currentPw, new_password: newPw });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setPwMsg({ ok: true, text: "Password changed successfully." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed";
      if (/401|unauthor/i.test(msg)) {
        logout();
        router.replace("/login");
        return;
      }
      setPwMsg({ ok: false, text: msg });
    } finally {
      setSavingPw(false);
    }
  }

  const backHref = me?.can_manage_configs ? "/admin" : "/";
  const roleLabel =
    me?.role === "super_admin"
      ? "Super admin"
      : me?.can_manage_configs
        ? "Manager"
        : "View only";

  const displayName = me?.name || "Your account";
  const avatarInitials = displayName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <PageShell>
      <TopBar title="Account settings" backHref={backHref} />

      {/* Identity rail + forms */}
      <div className="grid gap-6 lg:grid-cols-[344px_minmax(0,1fr)] lg:items-start lg:gap-14">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-[32px] font-semibold leading-tight text-ink">
              Your space. Your settings.
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              Keep your details up to date and your account secure.
            </p>
          </div>

          {/* Identity card */}
          <div className="card flex items-center gap-4 p-6">
            <span className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[20px] bg-accent-soft text-[22px] font-semibold text-accent">
              {avatarInitials || "🙂"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-ink">
                {displayName}
              </p>
              <p className="truncate text-[13px] text-muted">
                {me?.email ?? "—"}
              </p>
              <span
                className={`chip mt-2 ${
                  me?.role === "super_admin" ? "chip-accent" : ""
                }`}
              >
                {roleLabel}
              </span>
            </div>
          </div>

          <p className="flex items-start gap-2 text-xs text-muted">
            <IconKey className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            Your password is always private. Only you can update it here.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Profile */}
          <form onSubmit={saveProfile} className="card flex flex-col gap-6 p-8">
            <div className="flex items-center gap-3">
              <IconUser className="h-[18px] w-[18px] text-accent" />
              <h2 className="text-xl font-semibold text-ink">Profile</h2>
            </div>

            <div>
              <label htmlFor="name" className="label">
                Name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="field mt-2"
              />
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field mt-2"
              />
              <p className="hint mt-1.5">Used to sign in to your account.</p>
            </div>

            {profileMsg && (
              <Alert tone={profileMsg.ok ? "success" : "danger"}>
                {profileMsg.text}
              </Alert>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              className="btn-primary w-full"
            >
              {savingProfile && <IconRefresh className="h-4 w-4 animate-spin" />}
              {savingProfile ? "Saving…" : "Save profile"}
            </button>
          </form>

          {/* Password */}
          <form onSubmit={savePassword} className="card flex flex-col gap-6 p-8">
            <div className="flex items-center gap-3">
              <IconKey className="h-[18px] w-[18px] text-accent" />
              <h2 className="text-xl font-semibold text-ink">Change password</h2>
            </div>

            <div>
              <label htmlFor="currentPw" className="label">
                Current password
              </label>
              <input
                id="currentPw"
                type="password"
                autoComplete="current-password"
                required
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Enter your current password"
                className="field mt-2"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="newPw" className="label">
                  New password
                </label>
                <input
                  id="newPw"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="At least 8 characters"
                  className="field mt-2"
                />
              </div>
              <div>
                <label htmlFor="confirmPw" className="label">
                  Confirm new password
                </label>
                <input
                  id="confirmPw"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Re-enter new password"
                  className="field mt-2"
                />
              </div>
            </div>

            {pwMsg && (
              <Alert tone={pwMsg.ok ? "success" : "danger"}>
                {pwMsg.text}
              </Alert>
            )}

            <p className="text-xs text-muted">
              Got a temporary password by email? Sign in with it, then set a new
              one here.
            </p>

            <button
              type="submit"
              disabled={savingPw}
              className="btn-primary w-full"
            >
              {savingPw && <IconRefresh className="h-4 w-4 animate-spin" />}
              {savingPw ? "Updating…" : "Change password"}
            </button>
          </form>
        </div>
      </div>

      <BottomNav
        items={[
          { href: "/", label: "Jobs", icon: <IconBriefcase /> },
          ...(me?.can_manage_configs
            ? [{ href: "/admin", label: "Admin", icon: <IconGauge /> }]
            : []),
          { href: "/admin/profile", label: "Account", icon: <IconUser />, active: true },
        ]}
      />
    </PageShell>
  );
}
