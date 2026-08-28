"use client";

import Link from "next/link";
import { LogOut, Mail } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { MessagingUnreadBadge } from "@/components/mockup/beskeder-page";

export function KursistShell({
  children,
  courseTitle,
}: {
  children: React.ReactNode;
  courseTitle?: string;
}) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-slate-50">
      <header className="border-b border-teal-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <Link href="/kursist" className="text-sm font-semibold text-teal-800">
              Min kursus
            </Link>
            {courseTitle && (
              <p className="truncate text-xs text-slate-500">{courseTitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/kursist/beskeder"
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              <Mail className="size-4" />
              Beskeder
              {user && (
                <MessagingUnreadBadge userId={user.id} role={user.role} />
              )}
            </Link>
            {user && (
              <span className="hidden text-sm text-slate-600 sm:inline">
                {user.name}
              </span>
            )}
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              <LogOut className="size-4" />
              Log ud
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
