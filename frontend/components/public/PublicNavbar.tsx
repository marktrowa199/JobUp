"use client";

import Link from "next/link";
import { useState } from "react";

export function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="relative z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" className="text-xl font-bold tracking-tight text-slate-950" onClick={() => setIsOpen(false)}>
          Job<span className="text-indigo-600">Up</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Public navigation">
          <Link href="/about" className="text-sm font-medium text-slate-600 transition hover:text-slate-950">
            About
          </Link>
          <Link href="/login" className="text-sm font-semibold text-slate-700 transition hover:text-slate-950">
            Log In
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            Create Account
          </Link>
        </nav>

        <button
          type="button"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 md:hidden"
          aria-expanded={isOpen}
          aria-controls="mobile-public-navigation"
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? "Close" : "Menu"}
        </button>
      </div>

      {isOpen ? (
        <nav id="mobile-public-navigation" className="border-t border-slate-200 bg-white px-5 py-4 md:hidden" aria-label="Mobile public navigation">
          <div className="flex flex-col gap-1">
            <Link href="/about" onClick={() => setIsOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
              About
            </Link>
            <Link href="/login" onClick={() => setIsOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Log In
            </Link>
            <Link href="/register" onClick={() => setIsOpen(false)} className="mt-2 rounded-lg bg-indigo-600 px-3 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-500">
              Create Account
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
