"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export type ToastKind = "success" | "error" | "warning" | "info";

type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
  isLeaving?: boolean;
};

type NotificationContextValue = {
  notify: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

const kindStyles: Record<ToastKind, string> = {
  success: "border-emerald-200 bg-white text-emerald-800",
  error: "border-rose-200 bg-white text-rose-800",
  warning: "border-amber-200 bg-white text-amber-800",
  info: "border-sky-200 bg-white text-sky-800",
};

const kindIcons: Record<ToastKind, string> = {
  success: "✓",
  error: "!",
  warning: "!",
  info: "i",
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, isLeaving: true } : toast)));
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 180);
  }, []);

  const notify = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current.slice(-2), { id, kind, message }]);
    window.setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  return (
    <NotificationContext.Provider value={{ notify, dismiss }}>
      {children}
      <div className="pointer-events-none fixed left-1/2 top-4 z-50 flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-3" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-${toast.isLeaving ? "exit" : "enter"} pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-[0_14px_35px_-18px_rgba(15,23,42,0.45)] ${kindStyles[toast.kind]}`} role={toast.kind === "error" ? "alert" : "status"}>
            <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-current/10 text-xs font-bold">{kindIcons[toast.kind]}</span>
            <p className="flex-1 leading-6">{toast.message}</p>
            <button type="button" onClick={() => dismiss(toast.id)} className="rounded-md px-1 text-lg font-normal leading-5 text-current/50 transition hover:text-current" aria-label="Dismiss notification">×</button>
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
