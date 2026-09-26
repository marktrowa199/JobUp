"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export function UserProfile() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !profileRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [isOpen]);

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
    <div ref={profileRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5"
        aria-label={`Profile for ${user.full_name}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700">
          {initials}
        </div>
        <span className="hidden text-sm font-medium text-slate-700 md:inline">Profile</span>
        <div className="hidden text-left sm:block">
          <p className="max-w-32 truncate text-sm font-semibold text-slate-900">{user.full_name}</p>
        </div>
        <span aria-hidden="true" className="text-slate-400">▾</span>
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg" role="dialog" aria-label="Your profile">
          <div className="border-b border-slate-100 px-2 pb-3">
            <p className="font-semibold text-slate-900">{user.full_name}</p>
            <p className="mt-1 break-all text-sm text-slate-600">{user.email}</p>
          </div>
          <button type="button" className="mt-2 w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" onClick={() => router.push("/workspace")}>
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
          >
            Log Out
          </button>
        </div>
      ) : null}
    </div>
  );
}
