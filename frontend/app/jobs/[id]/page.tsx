"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getJob, type JobDetailsResponse } from "@/services/jobApi";

function formatPostedDate(value: string) {
  if (!value || value === "Posted recently") {
    return value || "Not specified";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export default function JobDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<JobDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const jobId = params.id;
    if (!jobId) {
      return;
    }

    let cancelled = false;
    getJob(jobId)
      .then((result) => {
        if (!cancelled) {
          setJob(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("We couldn't load this job. The job may have been removed or is temporarily unavailable.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
          Loading job details...
        </div>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-amber-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">We couldn&apos;t load this job.</h1>
          <p className="mt-3 text-slate-600">
            {error || "The job may have been removed or is temporarily unavailable."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-6 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Back to Search
          </button>
        </div>
      </main>
    );
  }

  const companyInfoAvailable = Boolean(
    job.company.description || job.company.website || job.company.industry,
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
          ← Back to Search
        </Link>

        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">{job.source}</p>
              <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">{job.title}</h1>
              <p className="mt-2 text-lg font-medium text-slate-600">{job.company.name}</p>
              <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-sm text-slate-500">
                <span>📍 {job.location}</span>
                <span>•</span>
                <span>{job.job_type}</span>
                <span>•</span>
                <span>Posted {formatPostedDate(job.posted_date)}</span>
              </div>
            </div>
            {job.url ? (
              <a
                href={job.url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-xl bg-indigo-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                View Original Job
              </a>
            ) : null}
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-slate-900">Job Description</h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">{job.description}</p>
          </section>

          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Job Information</h2>
              <dl className="mt-5 space-y-4 text-sm">
                <div>
                  <dt className="text-slate-400">Job Type</dt>
                  <dd className="mt-1 font-semibold text-slate-800">{job.job_type}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Location</dt>
                  <dd className="mt-1 font-semibold text-slate-800">{job.location}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Salary</dt>
                  <dd className="mt-1 font-semibold text-slate-800">{job.salary}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Remote</dt>
                  <dd className="mt-1 font-semibold text-slate-800">{job.remote}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Posted</dt>
                  <dd className="mt-1 font-semibold text-slate-800">{formatPostedDate(job.posted_date)}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">About the Company</h2>
              <p className="mt-2 font-semibold text-slate-800">{job.company.name}</p>
              {companyInfoAvailable ? (
                <dl className="mt-5 space-y-4 text-sm">
                  {job.company.description ? (
                    <div>
                      <dt className="text-slate-400">Company Description</dt>
                      <dd className="mt-1 leading-6 text-slate-700">{job.company.description}</dd>
                    </div>
                  ) : null}
                  {job.company.industry ? (
                    <div>
                      <dt className="text-slate-400">Industry</dt>
                      <dd className="mt-1 font-semibold text-slate-800">{job.company.industry}</dd>
                    </div>
                  ) : null}
                  {job.company.website ? (
                    <div>
                      <dt className="text-slate-400">Website</dt>
                      <dd className="mt-1 break-all font-semibold text-indigo-600">{job.company.website}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : (
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Company information not provided by the job provider.
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
