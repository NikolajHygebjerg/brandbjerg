"use client";

import Link from "next/link";
import { UserMenu } from "@/components/auth/user-menu";

export function OverblikShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white px-4 py-3 lg:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link
            href="/planlaegning/statusark"
            className="text-sm font-semibold text-slate-900 hover:text-emerald-800"
          >
            Kursusplatform
          </Link>
          <UserMenu />
        </div>
      </header>
      {children}
    </div>
  );
}
