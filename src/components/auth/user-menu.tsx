"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Pencil, Trash2, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { userRoleLabels, type UserRole } from "@/lib/auth-types";
import { isAdminRole, requiresBrandbjergEmail } from "@/lib/auth-types";
import { getDefaultRouteForRole } from "@/lib/auth-permissions";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (!user) return null;

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
          aria-label="Brugermenu"
          title={user.name}
        >
          <UserCircle className="h-5 w-5" />
        </button>

        {open && (
          <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="font-semibold text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
              <p className="mt-1 text-xs font-medium text-emerald-700">
                {userRoleLabels[user.role]}
              </p>
            </div>
            <div className="py-1">
              <MenuButton
                icon={Pencil}
                label="Rediger brugeroplysninger"
                onClick={() => {
                  setOpen(false);
                  setProfileOpen(true);
                }}
              />
              <MenuButton
                icon={LogOut}
                label="Log ud"
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
              />
            </div>
          </div>
        )}
      </div>

      {profileOpen && (
        <ProfileDialog onClose={() => setProfileOpen(false)} />
      )}
    </>
  );
}

function MenuButton({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm ${
        danger
          ? "text-red-700 hover:bg-red-50"
          : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function ProfileDialog({ onClose }: { onClose: () => void }) {
  const { user, updateProfile, deleteAccount, logout } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<UserRole>(user?.role ?? "kursist");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!user) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const result = updateProfile({
      name,
      email,
      ...(user && isAdminRole(user.role) ? { role } : {}),
      password: password.trim() || undefined,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
    router.replace(getDefaultRouteForRole(result.user.role));
  }

  function handleDelete() {
    if (
      !window.confirm(
        "Er du sikker på, at du vil slette din bruger? Dette kan ikke fortrydes.",
      )
    ) {
      return;
    }
    const result = deleteAccount();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    logout();
    onClose();
    router.replace("/login");
  }

  const canEditRole = isAdminRole(user.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-xl"
        role="dialog"
        aria-modal
      >
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">
            Brugeroplysninger
          </h2>
          <p className="text-sm text-slate-500">
            Ret dine oplysninger eller slet brugeren
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4 px-5 py-4">
          <Field label="Navn">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </Field>

          <Field label="E-mail">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </Field>

          {canEditRole && (
            <Field label="Brugertype">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {(Object.keys(userRoleLabels) as UserRole[]).map((r) => (
                  <option key={r} value={r}>
                    {userRoleLabels[r]}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {!canEditRole && (
            <Field label="Brugertype">
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {userRoleLabels[user.role]}
              </p>
            </Field>
          )}

          <Field label="Ny adgangskode (valgfri)">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Mindst 6 tegn"
              minLength={6}
            />
          </Field>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Gemmer…" : "Gem ændringer"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuller
            </Button>
          </div>
        </form>

        <div className="border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-2 text-sm font-medium text-red-700 hover:underline"
          >
            <Trash2 className="h-4 w-4" />
            Slet bruger
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
