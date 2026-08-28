"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import {
  canAccessKursistPages,
  isBrandbjergEmail,
  userRoleLabels,
  type UserRole,
} from "@/lib/auth-types";
import { getDefaultRouteForRole } from "@/lib/auth-permissions";
import { SEED_PASSWORD } from "@/lib/auth-seed";

type Mode = "login" | "register";

export function AuthPage() {
  const { user, hydrated, login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("kursist");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!hydrated || !user) return;
    router.replace(getDefaultRouteForRole(user.role));
  }, [hydrated, user, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Indlæser…
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Omdirigerer…
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result =
      mode === "login"
        ? login(email, password)
        : register({ email, password, name, role });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.push(getDefaultRouteForRole(result.user.role));
  }

  const staffRoleSelected = false;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-950 via-emerald-900 to-slate-900 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center text-white">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-lg font-bold">
            KP
          </div>
          <h1 className="text-2xl font-bold">Kursusplatform</h1>
          <p className="mt-1 text-sm text-emerald-100">
            Log ind eller opret bruger for at fortsætte
          </p>
        </div>

        <Card>
          <div className="mb-6 flex rounded-lg bg-slate-100 p-1">
            <TabButton
              active={mode === "login"}
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              icon={LogIn}
              label="Log ind"
            />
            <TabButton
              active={mode === "register"}
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              icon={UserPlus}
              label="Opret bruger"
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <AuthField label="Navn">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    required
                  />
                </AuthField>

                <AuthField label="Brugertype">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    {( ["kursist"] as UserRole[]).map((r) => (
                      <option key={r} value={r}>
                        {userRoleLabels[r]}
                      </option>
                    ))}
                  </select>
                  {staffRoleSelected && (
                    <p className="mt-1 text-xs text-slate-500">
                      Medarbejdere oprettes af admin under Brugere
                    </p>
                  )}
                  {role === "kursist" && (
                    <p className="mt-1 text-xs text-teal-700">
                      Kursister får adgang til Min kursus-appen med program og
                      Eva-evalueringer
                    </p>
                  )}
                </AuthField>
              </>
            )}

            <AuthField label="E-mail">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder={
                  staffRoleSelected ? "navn@brandbjerg.dk" : "din@email.dk"
                }
                required
              />
            </AuthField>

            <AuthField label="Adgangskode">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                minLength={6}
                required
              />
            </AuthField>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting
                ? "Vent…"
                : mode === "login"
                  ? "Log ind"
                  : "Opret bruger"}
            </Button>
          </form>

          <CardDescription className="mt-4 text-center">
            <Link href="/" className="text-emerald-700 hover:underline">
              ← Tilbage til forsiden
            </Link>
          </CardDescription>

          <p className="mt-4 rounded-lg bg-teal-50 px-3 py-2 text-center text-xs text-teal-900">
            Kursist-demo: deltager0@example.dk · Adgangskode {SEED_PASSWORD}
          </p>
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-950">
            Rengøringsleder: hlu@brandbjerg.dk · Superadmin: nh@brandbjerg.dk ·
            Adgangskode {SEED_PASSWORD}
          </p>
        </Card>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof LogIn;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-600 hover:text-slate-900"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function AuthField({
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
