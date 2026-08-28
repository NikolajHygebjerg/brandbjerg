"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, Plus, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import {
  ALL_USER_ROLES,
  userRoleLabels,
  type UserRole,
} from "@/lib/auth-types";
import {
  AUTH_UPDATED_EVENT,
  adminCreateUser,
  adminDeleteUser,
  listAllUsers,
  updateUser,
} from "@/lib/auth-storage";
import { canManageUsers } from "@/lib/auth-permissions";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/auth-types";

export function BrugerePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tick, setTick] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (user && !canManageUsers(user.role)) {
      router.replace("/ingen-adgang");
    }
  }, [user, router]);

  useEffect(() => {
    function onUpdate() {
      reload();
    }
    window.addEventListener(AUTH_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(AUTH_UPDATED_EVENT, onUpdate);
  }, [reload]);

  const users = useMemo(
    () => listAllUsers(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick],
  );

  if (!user || !canManageUsers(user.role)) {
    return (
      <Card>
        <CardDescription>Kræver admin-adgang…</CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-violet-700" />
            <h1 className="text-2xl font-bold text-slate-900">Brugere</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Administrer brugere, roller og adgang til platformen
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Opret bruger
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Navn</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Rolle</th>
                <th className="px-4 py-3">Oprettet</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {u.name}
                    {u.id === user.id && (
                      <span className="ml-2 text-xs font-normal text-emerald-700">
                        (dig)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800">
                      {userRoleLabels[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString("da-DK")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="secondary"
                      className="h-8 text-xs"
                      onClick={() => setEditing(u)}
                    >
                      Rediger
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="border-violet-100 bg-violet-50/50">
        <CardTitle className="flex items-center gap-2 text-base text-violet-900">
          <ClipboardList className="h-4 w-4" />
          Rolleoversigt
        </CardTitle>
        <ul className="mt-3 space-y-2 text-sm text-violet-950">
          <li>
            <strong>Kursusleder</strong> — fællessider + kursusleder
          </li>
          <li>
            <strong>Højskolelærer</strong> — kun værelsesbooking
          </li>
          <li>
            <strong>Kursist</strong> — kun kursist-app
          </li>
          <li>
            <strong>Køkkenleder / assistent</strong> — fællessider + køkken
          </li>
          <li>
            <strong>Rengøringsleder</strong> — fællessider + rengøring inkl.
            admin
          </li>
          <li>
            <strong>Rengøringsassistent</strong> — fællessider + rengøring
            (tildelte opgaver)
          </li>
          <li>
            <strong>Pedelleder / assistent</strong> — fællessider + pedel
          </li>
          <li>
            <strong>Kontor</strong> — fællessider + kontor
          </li>
          <li>
            <strong>Admin</strong> — fuld adgang
          </li>
        </ul>
        <p className="mt-3 text-xs text-violet-800">
          Demo admin: admin@brandbjerg.dk · Adgangskode Brandbjerg1234
        </p>
      </Card>

      {showCreate && (
        <UserFormDialog
          title="Opret bruger"
          onClose={() => setShowCreate(false)}
          onSave={(data) => {
            const result = adminCreateUser(data);
            if (!result.ok) return result.error;
            reload();
            setShowCreate(false);
            return null;
          }}
        />
      )}

      {editing && (
        <UserFormDialog
          title="Rediger bruger"
          initial={editing}
          onClose={() => setEditing(null)}
          onDelete={
            editing.id !== user.id
              ? () => {
                  adminDeleteUser(editing.id);
                  reload();
                  setEditing(null);
                }
              : undefined
          }
          onSave={(data) => {
            const result = updateUser(editing.id, {
              name: data.name,
              email: data.email,
              role: data.role,
              ...(data.password ? { password: data.password } : {}),
            });
            if (!result.ok) return result.error;
            reload();
            setEditing(null);
            return null;
          }}
        />
      )}
    </div>
  );
}

function UserFormDialog({
  title,
  initial,
  onClose,
  onSave,
  onDelete,
}: {
  title: string;
  initial?: User;
  onClose: () => void;
  onSave: (data: {
    name: string;
    email: string;
    role: UserRole;
    password: string;
  }) => string | null;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [role, setRole] = useState<UserRole>(initial?.role ?? "kursusleder");
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const err = onSave({
      name,
      email,
      role,
      password,
    });
    setSaving(false);
    if (err) {
      setError(err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
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
          <Field label="Rolle">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {ALL_USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {userRoleLabels[r]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={initial ? "Ny adgangskode (valgfri)" : "Adgangskode"}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              minLength={initial ? undefined : 6}
              required={!initial}
              placeholder={initial ? "Tom = uændret" : "Mindst 6 tegn"}
            />
          </Field>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Gemmer…" : "Gem"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuller
            </Button>
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="ml-auto inline-flex items-center gap-1 text-sm text-red-700 hover:underline"
              >
                <Trash2 className="h-4 w-4" />
                Slet bruger
              </button>
            )}
          </div>
        </form>
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
