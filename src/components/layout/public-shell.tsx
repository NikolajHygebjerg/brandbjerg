"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/user-menu";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/katalog" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-800 text-sm font-bold text-white">
              H
            </div>
            <div>
              <p className="font-semibold text-stone-900">Højskolen</p>
              <p className="text-xs text-stone-500">Korte kurser</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button href="/planlaegning/statusark" variant="outline" className="hidden sm:inline-flex">
              Admin
            </Button>
            <UserMenu />
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-stone-200 bg-white py-8 text-center text-sm text-stone-500">
        Offentlig tilmelding · GDPR-venlig (ingen CPR i demo)
      </footer>
    </div>
  );
}
