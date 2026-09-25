"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNotifications } from "@/components/notifications/NotificationProvider";

type AuthFormProps = {
  mode: "login" | "register";
};

type PasswordFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  autoComplete: "new-password" | "current-password";
  onChange: (value: string) => void;
};

function PasswordField({ label, value, placeholder, autoComplete, onChange }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const inputId = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700">
      {label}
      <span className="relative mt-2 block">
        <input
          id={inputId}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          aria-label={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          title={isVisible ? "Hide password" : "Show password"}
        >
          {isVisible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </span>
    </label>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.5-6 9.75-6 9.75 6 9.75 6-3.5 6-9.75 6-9.75-6-9.75-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 18M10.6 6.2A10.8 10.8 0 0 1 12 6c6.25 0 9.75 6 9.75 6a17.7 17.7 0 0 1-3.1 3.75M6.6 6.7C3.9 8.55 2.25 12 2.25 12s3.5 6 9.75 6c1.02 0 1.95-.16 2.8-.43" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.88 9.88a3 3 0 0 0 4.24 4.24" />
    </svg>
  );
}

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
      <PasswordField
        label="Password"
        value={password}
        onChange={setPassword}
        autoComplete={isRegister ? "new-password" : "current-password"}
        placeholder="Enter your password"
      />
      {isRegister ? (
        <PasswordField
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          placeholder="Repeat your password"
        />
      ) : null}
      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p> : null}
      <button type="submit" disabled={submitting} className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300">
        {submitting ? (isRegister ? "Creating Account..." : "Signing In...") : isRegister ? "Create Account" : "Log In"}
      </button>
      {!isRegister ? <Link href="#" className="block text-center text-sm font-semibold text-indigo-600 hover:text-indigo-500">Forgot password?</Link> : null}
    </form>
  );
}
