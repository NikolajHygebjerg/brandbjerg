"use client";

import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { userRoleLabels } from "@/lib/auth-types";

export default function IngenAdgangPage() {
  const { user, hydrated, logout } = useAuth();

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Indlæser…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-800">
          <ShieldOff className="h-7 w-7" />
        </div>
        <CardTitle className="mt-4">Ingen adgang</CardTitle>
        <CardDescription className="mt-2">
          {user ? (
            <>
              Du er logget ind som{" "}
              <span className="font-medium text-slate-800">
                {userRoleLabels[user.role]}
              </span>
              . Kursister har ikke adgang til platformens sider i denne version.
            </>
          ) : (
            "Du skal logge ind for at fortsætte."
          )}
        </CardDescription>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {user ? (
            <Button variant="secondary" onClick={logout}>
              Log ud
            </Button>
          ) : (
            <Button href="/login">Log ind</Button>
          )}
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Forside
          </Link>
        </div>
      </Card>
    </div>
  );
}
