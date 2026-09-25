"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNotifications } from "@/components/notifications/NotificationProvider";

export function ProtectedWorkspace({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { notify } = useNotifications();

  useEffect(() => {
    if (!loading && !user) {
      notify("info", "Please log in to access your JobUp workspace.");
      router.replace("/login?next=/workspace");
    }
  }, [loading, notify, router, user]);

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-slate-100 px-5 py-16 text-center text-slate-600">
        Checking your JobUp session...
      </main>
    );
  }

  return <>{children}</>;
}
