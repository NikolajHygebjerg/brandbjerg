"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  canAccessAdminPortal,
  canAccessRoute,
  getDefaultRouteForRole,
} from "@/lib/auth-permissions";

type AuthGuardProps = {
  children: React.ReactNode;
  staffOnly?: boolean;
};

export function AuthGuard({ children, staffOnly = true }: AuthGuardProps) {
  const { user, hydrated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (staffOnly && !canAccessAdminPortal(user.role)) {
      router.replace("/ingen-adgang");
      return;
    }
    if (staffOnly && !canAccessRoute(user.role, pathname)) {
      router.replace(getDefaultRouteForRole(user.role));
    }
  }, [hydrated, user, staffOnly, pathname, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Indlæser…
      </div>
    );
  }

  if (!user) return null;
  if (staffOnly && !canAccessAdminPortal(user.role)) return null;
  if (staffOnly && !canAccessRoute(user.role, pathname)) return null;

  return <>{children}</>;
}
