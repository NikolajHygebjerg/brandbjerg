"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { canAccessKursistPages } from "@/lib/auth-types";
import { canAccessAdminPortal, getDefaultRouteForRole } from "@/lib/auth-permissions";

export function KursistAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login?portal=kursist");
      return;
    }
    if (canAccessAdminPortal(user.role)) {
      router.replace(getDefaultRouteForRole(user.role));
      return;
    }
    if (!canAccessKursistPages(user.role)) {
      router.replace("/ingen-adgang");
    }
  }, [hydrated, user, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Indlæser…
      </div>
    );
  }

  if (!user || !canAccessKursistPages(user.role)) return null;

  return <>{children}</>;
}
