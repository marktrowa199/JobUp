"use client";

import Link from "next/link";
import { UserProfile } from "@/components/profile/UserProfile";

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/workspace" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm">
            J
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">JobUp</p>
          </div>
        </Link>

        <UserProfile />
      </div>
    </header>
  );
}
