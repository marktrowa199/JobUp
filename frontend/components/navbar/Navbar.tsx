"use client";

import Link from "next/link";
import { UserProfile } from "@/components/profile/UserProfile";

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-1 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
        <Link href="/workspace" className="flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white sm:h-9 sm:w-9">
            J
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900">JobUp</p>
          </div>
        </Link>

        <nav aria-label="Main navigation" className="ml-auto flex shrink-0 items-center gap-1 text-[11px] font-medium sm:gap-6 sm:text-sm">
          <Link href="/workspace#job-search-title" className="whitespace-nowrap text-slate-700 transition hover:text-indigo-700">Job Search</Link>
          <Link href="/workspace#my-applications" className="whitespace-nowrap text-slate-700 transition hover:text-indigo-700">Applications</Link>
        </nav>
        <UserProfile />
      </div>
    </header>
  );
}
