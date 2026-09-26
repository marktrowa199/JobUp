"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { ApplicationOverview } from "@/components/jobs/ApplicationOverview";
import { ResumeDiscovery } from "@/components/jobs/ResumeDiscovery";

export function WorkspaceLanding() {
  const { user } = useAuth();

  return (
    <main className="mx-auto min-h-[calc(100vh-4.5rem)] max-w-7xl px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <header className="mb-7 border-b border-slate-200 pb-6">
        <p className="text-sm font-medium text-slate-500">Welcome back, {user?.full_name ?? "there"}</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Find Your Next Opportunity</h1>
        <p className="mt-2 max-w-2xl text-base text-slate-600">
          Upload your resume to discover Philippine opportunities matched to your experience.
        </p>
      </header>

      <ResumeDiscovery />
      <ApplicationOverview />
    </main>
  );
}