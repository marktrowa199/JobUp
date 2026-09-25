"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserProfile } from "@/components/profile/UserProfile";

const navItems = [
  { label: "Job Search", href: "/workspace" },
  { label: "People Search", href: "/workspace/people" },
  { label: "Career Advice", href: "/workspace/career-advice" },
  { label: "Companies", href: "/workspace/companies" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isCurrent = (href: string) => href === "/workspace"
    ? pathname === href
    : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/workspace" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm">
            J
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">JobUp</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              aria-current={isCurrent(href) ? "page" : undefined}
              className={isCurrent(href)
                ? "border-b-2 border-indigo-600 pb-1 text-sm font-semibold text-indigo-700"
                : "text-sm font-medium text-slate-600 transition hover:text-slate-900"}
            >
              {label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 md:hidden"
          aria-expanded={mobileOpen}
          aria-controls="workspace-mobile-navigation"
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? "Close" : "Menu"}
        </button>
        <UserProfile />
      </div>
      <nav id="workspace-mobile-navigation" className={`${mobileOpen ? "grid" : "hidden"} gap-1 border-t border-slate-100 px-4 py-3 md:hidden`}>
        {navItems.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            aria-current={isCurrent(href) ? "page" : undefined}
            onClick={() => setMobileOpen(false)}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${isCurrent(href) ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
