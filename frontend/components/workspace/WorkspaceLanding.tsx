"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { ApplicationOverview } from "@/components/jobs/ApplicationOverview";
import { JobSearchPanel } from "@/components/jobs/JobSearchPanel";
import { ResumeDiscovery } from "@/components/jobs/ResumeDiscovery";

export function WorkspaceLanding() {
  const { user } = useAuth();

  return (
    <main className="mx-auto min-h-[calc(100vh-4.5rem)] max-w-6xl px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <header className="mb-6 border-b border-slate-200 pb-5">
        <p className="text-sm text-slate-500">Welcome back, {user?.full_name ?? "there"}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Find your next opportunity</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Search jobs that match what you’re looking for, or use your resume to find a good fit.
        </p>
      </header>

      <JobSearchPanel />
      <ResumeDiscovery />
      <ApplicationOverview />
    </main>
  );
}
