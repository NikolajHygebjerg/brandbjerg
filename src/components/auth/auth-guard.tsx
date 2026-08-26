"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { canAccessStaffPages } from "@/lib/auth-storage";

type AuthGuardProps = {
  children: React.ReactNode;
  staffOnly?: boolean;
};

export function AuthGuard({ children, staffOnly = true }: AuthGuardProps) {
  const { user, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (staffOnly && !canAccessStaffPages(user.role)) {
      router.replace("/ingen-adgang");
    }
  }, [hydrated, user, staffOnly, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Indlæser…
      </div>
    );
  }

  if (!user) return null;
  if (staffOnly && !canAccessStaffPages(user.role)) return null;

  return <>{children}</>;
}
