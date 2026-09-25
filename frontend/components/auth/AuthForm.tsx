"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNotifications } from "@/components/notifications/NotificationProvider";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { refresh } = useAuth();
  const { notify } = useNotifications();
  const isRegister = mode === "register";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (isRegister && !fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    if (isRegister && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isRegister ? { full_name: fullName, email, password } : { email, password }),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string; user?: { full_name: string } } | null;

      if (!response.ok) {
        setError(payload?.message || "Unable to complete that request. Please try again.");
        notify("error", payload?.message || "Unable to complete that request.");
        return;
      }

      if (isRegister) {
        notify("success", "Your JobUp account has been created successfully.");
        router.push("/login");
        return;
      }

      const user = await refresh();
      notify("success", `Welcome back, ${user?.full_name || payload?.user?.full_name || "job seeker"}!`);
      const nextPath = new URLSearchParams(window.location.search).get("next") || "/workspace";
      router.push(nextPath.startsWith("/") ? nextPath : "/workspace");
    } catch {
      setError("JobUp is temporarily unavailable. Please try again.");
      notify("error", "JobUp is temporarily unavailable. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
      {isRegister ? (
        <label className="block text-sm font-semibold text-slate-700">
          Full Name
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" placeholder="Your full name" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500" />
        </label>
      ) : null}
      <label className="block text-sm font-semibold text-slate-700">
        Email Address
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500" />
      </label>
      <label className="block text-sm font-semibold text-slate-700">
        Password
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isRegister ? "new-password" : "current-password"} placeholder="Enter your password" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500" />
      </label>
      {isRegister ? (
        <label className="block text-sm font-semibold text-slate-700">
          Confirm Password
          <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" placeholder="Repeat your password" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500" />
        </label>
      ) : null}
      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p> : null}
      <button type="submit" disabled={submitting} className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300">
        {submitting ? (isRegister ? "Creating Account..." : "Signing In...") : isRegister ? "Create Account" : "Log In"}
      </button>
      {!isRegister ? <Link href="#" className="block text-center text-sm font-semibold text-indigo-600 hover:text-indigo-500">Forgot password?</Link> : null}
    </form>
  );
}
