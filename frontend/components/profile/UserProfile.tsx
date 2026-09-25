"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export function UserProfile() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (loading || !user) {
    return <div className="h-12 w-12 rounded-full bg-slate-100" aria-label="Loading profile" />;
  }

  const initials = user.full_name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-2 py-2 shadow-sm"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
          {initials}
        </div>
        <div className="hidden text-left sm:block">
          <p className="max-w-32 truncate text-sm font-semibold text-slate-900">{user.full_name}</p>
          <p className="text-xs text-slate-500">{user.status}</p>
        </div>
        <span aria-hidden="true" className="text-slate-400">▾</span>
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-full z-30 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg" role="menu">
          <button type="button" className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" onClick={() => router.push("/workspace")} role="menuitem">
            Workspace
          </button>
          <button
            type="button"
            className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
            onClick={async () => {
              setIsOpen(false);
              if (await logout()) {
                router.push("/");
              }
            }}
            role="menuitem"
          >
            Log Out
          </button>
        </div>
      ) : null}
    </div>
  );
}
