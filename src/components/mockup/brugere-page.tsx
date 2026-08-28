"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ClipboardList, Download, FileSpreadsheet, Plus, Trash2, Upload, Users } from "lucide-react";
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
  adminBatchCreateUsers,
  adminCreateUser,
  adminDeleteUser,
  isSeedUser,
  listAllUsers,
  updateUser,
} from "@/lib/auth-storage";
import { canManageUsers } from "@/lib/auth-permissions";
import {
  acceptedImportFileName,
  downloadUserImportTemplate,
  parseUserImportFile,
  USER_IMPORT_DEFAULT_PASSWORD,
} from "@/lib/user-import-utils";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/auth-types";

export function BrugerePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tick, setTick] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<
    { rowNumber: number; email?: string; message: string }[]
  >([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleImportFile(file: File) {
    setImportMessage(null);
    setImportErrors([]);
    if (!acceptedImportFileName(file.name)) {
      setImportErrors([
        { rowNumber: 0, message: "Vælg en .xlsx-, .xls- eller .csv-fil." },
      ]);
      return;
    }

    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseUserImportFile(buffer);

      if (parsed.rows.length === 0) {
        setImportErrors(parsed.errors);
        return;
      }

      const batch = adminBatchCreateUsers(
        parsed.rows.map((row) => ({
          rowNumber: row.rowNumber,
          name: row.name,
          email: row.email,
          phone: row.phone,
          role: row.role,
          password: USER_IMPORT_DEFAULT_PASSWORD,
        })),
      );

      setImportErrors([
        ...parsed.errors.map((e) => ({
          rowNumber: e.rowNumber,
          message: e.message,
        })),
        ...batch.errors,
      ]);
      setImportMessage(
        `${batch.created} brugere oprettet` +
          (batch.skipped > 0 ? ` · ${batch.skipped} sprunget over` : "") +
          (parsed.errors.length > 0
            ? ` · ${parsed.errors.length} rækker kunne ikke læses`
            : ""),
      );
      reload();
    } catch {
      setImportErrors([
        {
          rowNumber: 0,
          message:
            "Kunne ikke læse filen. Tjek at den er et gyldigt Excel-ark.",
        },
      ]);
    } finally {
      setImporting(false);
    }
  }

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
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-1.5 h-4 w-4" />
            {importing ? "Importerer…" : "Importer Excel"}
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Opret bruger
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            void handleImportFile(file);
          }}
        />
      </div>

      <Card className="border-slate-200">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSpreadsheet className="h-4 w-4 text-violet-700" />
          Import fra Excel
        </CardTitle>
        <CardDescription className="mt-1">
          Upload et regneark for at oprette mange brugere på én gang
        </CardDescription>

        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="space-y-3 text-sm text-slate-700">
            <p className="font-medium text-slate-900">Format og felter</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                Filtyper: <strong>.xlsx</strong>, <strong>.xls</strong> eller{" "}
                <strong>.csv</strong>
              </li>
              <li>Første række skal være kolonneoverskrifter</li>
              <li>
                <strong>Navn</strong> (påkrævet) — brugerens fulde navn
              </li>
              <li>
                <strong>email</strong> (påkrævet) — unik login-mail. Medarbejdere
                skal bruge <code className="text-xs">@brandbjerg.dk</code>
              </li>
              <li>
                <strong>telefonnummer</strong> (valgfri) — gemmes på brugeren
              </li>
              <li>
                <strong>Titel</strong> (påkrævet) — mappes til rolle, fx
                «Kursusleder», «Kontor», «Rengøringsassistent»
              </li>
            </ul>
            <p className="text-xs text-slate-500">
              Kolonnenavne kan også være engelske (Name, phone, role). Tomme
              rækker ignoreres. Eksisterende e-mails springes over.
            </p>
            <p className="text-xs text-slate-500">
              Alle importerede brugere får midlertidig adgangskode{" "}
              <strong>{USER_IMPORT_DEFAULT_PASSWORD}</strong> — bed dem skifte
              den ved første login.
            </p>
            <Button
              type="button"
              variant="secondary"
              className="mt-2 h-9"
              onClick={downloadUserImportTemplate}
            >
              <Download className="mr-1.5 h-4 w-4" />
              Download skabelon (.xlsx)
            </Button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="font-medium text-slate-900">Gyldige titler / roller</p>
            <ul className="mt-2 grid gap-1 text-slate-700 sm:grid-cols-2">
              {ALL_USER_ROLES.map((role) => (
                <li key={role}>· {userRoleLabels[role]}</li>
              ))}
            </ul>
          </div>
        </div>

        {importMessage && (
          <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {importMessage}
          </p>
        )}
        {importErrors.length > 0 && (
          <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
            <p className="font-medium">Importadvarsler</p>
            <ul className="mt-1 max-h-40 space-y-1 overflow-y-auto">
              {importErrors.map((err, idx) => (
                <li key={`${err.rowNumber}-${idx}`}>
                  {err.rowNumber > 0 ? `Række ${err.rowNumber}` : "Fil"}
                  {err.email ? ` (${err.email})` : ""}: {err.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Navn</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Telefon</th>
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
                    {isSeedUser(u.id) && (
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        demo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3 text-slate-500">{u.phone ?? "—"}</td>
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
                  const result = adminDeleteUser(editing.id);
                  if (!result.ok) {
                    setImportMessage(null);
                    setImportErrors([
                      { rowNumber: 0, message: result.error },
                    ]);
                    return;
                  }
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
              phone: data.phone,
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
    phone?: string;
  }) => string | null;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [role, setRole] = useState<UserRole>(initial?.role ?? "kursusleder");
  const [phone, setPhone] = useState(initial?.phone ?? "");
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
      phone: phone.trim() || undefined,
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
          <Field label="Telefon (valgfri)">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="12345678"
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
