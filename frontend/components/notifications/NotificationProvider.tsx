"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export type ToastKind = "success" | "error" | "info";

type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

type NotificationContextValue = {
  notify: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

const kindStyles: Record<ToastKind, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current.slice(-2), { id, kind, message }]);
    window.setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  return (
    <NotificationContext.Provider value={{ notify, dismiss }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(92vw,380px)] flex-col gap-3" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg ${kindStyles[toast.kind]}`} role={toast.kind === "error" ? "alert" : "status"}>
            <span aria-hidden="true" className="text-base">{toast.kind === "success" ? "✓" : toast.kind === "error" ? "!" : "i"}</span>
            <p className="flex-1 leading-5">{toast.message}</p>
            <button type="button" onClick={() => dismiss(toast.id)} className="rounded-md px-1 text-current/60 hover:text-current" aria-label="Dismiss notification">×</button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used inside NotificationProvider");
  }
  return context;
}
