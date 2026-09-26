"use client";

import { useEffect, useState } from "react";
import { normalizeJobFromApi, type Job } from "@/lib/jobSearch";
import {
  getRoleSearchQueries,
  rankResumeJob,
  type ResumeJobMatch,
  type ResumeProfile,
} from "@/lib/resumeDiscovery";
import { searchJobsApi } from "@/services/jobApi";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import { UserFacingError, userFacingErrorMessage } from "@/lib/userFacingErrors";
import { ApplicationLink } from "@/components/jobs/ApplicationLink";

function RecommendationCard({ match }: { match: ResumeJobMatch }) {
  const { job, score, matchedSkills, reason } = match;
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-semibold text-slate-900">{job.title}</h3>
          <p className="mt-1 text-sm font-medium text-slate-600">{job.company}</p>
        </div>
        <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          {score}% match
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-500">{job.location} · {job.type} · {job.listingTime}</p>
      <p className="mt-2 text-sm font-medium text-slate-700">{job.pay}</p>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{job.description}</p>
      <p className="mt-3 text-sm text-indigo-800">{reason}</p>
      {matchedSkills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Skills in your resume also mentioned in this listing">
          {matchedSkills.map((skill) => (
            <span key={skill} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
              {skill}
            </span>
          ))}
        </div>
      )}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span className="truncate text-xs text-slate-500">{job.source}</span>
        <ApplicationLink job={job} className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500" />
      </div>
    </article>
  );
}
export function ResumeDiscovery() {
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [matches, setMatches] = useState<ResumeJobMatch[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<{ title: string; message: string; retryable?: boolean } | null>(null);
  const [searchAttempt, setSearchAttempt] = useState(0);
  const { notify } = useNotifications();

  useEffect(() => {
    if (!profile) return;
    const activeProfile = profile;
    let cancelled = false;
    const roles = getRoleSearchQueries(activeProfile);

    async function loadMatches() {
      setSearching(true);
      setError(null);
      try {
        // Search Google Jobs with one recognizable title. A comma-separated list of
        // roles is not a reliable Google Jobs query and can trigger provider errors.
        const keyword = roles[0] || activeProfile.skills.slice(0, 2).join(" ");
        const response = await searchJobsApi({ keyword, location: "Philippines" });
        if (cancelled) return;

        const uniqueJobs = new Map<string, Job>();
        for (const item of response.jobs) {
          const job = normalizeJobFromApi(item);
          const key = job.url || `${job.title}|${job.company}|${job.location}`.toLowerCase();
          if (!uniqueJobs.has(key)) uniqueJobs.set(key, job);
        }

        const ranked = [...uniqueJobs.values()]
          .map((job) => rankResumeJob(job, activeProfile, roles))
          .sort((first, second) => second.score - first.score)
          .slice(0, 8);
        setMatches(ranked);
        if (ranked.length === 0) {
          setError({ title: "Recommendations", message: userFacingErrorMessage("NO_RESULTS") });
        }
      } catch (searchError) {
        if (cancelled) return;
        if (process.env.NODE_ENV === "development") {
          console.error("Resume job matching failed.", {
            name: searchError instanceof Error ? searchError.name : "UnknownError",
            message: searchError instanceof Error ? searchError.message.slice(0, 200) : "Unknown error",
          });
        }
        setMatches([]);
        const message = searchError instanceof UserFacingError
          ? searchError.message
          : userFacingErrorMessage("RECOMMENDATIONS_UNAVAILABLE");
        setError({
          title: "Recommendations",
          message,
          retryable: true,
        });
        notify("warning", message);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }

    void loadMatches();
    return () => { cancelled = true; };
  }, [profile, searchAttempt, notify]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      const message = "Resume files must be 8 MB or smaller.";
      setError({ title: "File too large", message });
      notify("error", message);
      return;
    }
    if (!/\.(pdf|docx|txt)$/i.test(file.name)) {
      const message = userFacingErrorMessage("UNSUPPORTED_FILE_TYPE");
      setError({ title: "Resume couldn't be read", message });
      notify("warning", message);
      return;
    }

    setAnalyzing(true);
    setSearching(false);
    setError(null);
    setMatches([]);
    setProfile(null);
    const form = new FormData();
    form.set("resume", file);

    try {
      const response = await fetch("/api/resume/analyze", { method: "POST", body: form, cache: "no-store" });
      const payload = await response.json() as { profile?: ResumeProfile; code?: string };
      if (!response.ok || !payload.profile) {
        const message = userFacingErrorMessage(payload.code, "RESUME_ANALYSIS_UNAVAILABLE");
        setError({ title: "Resume upload", message });
        notify("warning", message);
        return;
      }
      setProfile(payload.profile);
      notify("success", "Resume analyzed. Finding matching jobs across the Philippines.");
    } catch {
      const message = userFacingErrorMessage("RESUME_ANALYSIS_UNAVAILABLE");
      setError({ title: "Resume upload", message });
      notify("warning", message);
    } finally {
      setAnalyzing(false);
    }
  };

  const clearResume = () => {
    setProfile(null);
    setMatches([]);
    setSearching(false);
    setError(null);
    notify("info", "Saved resume analysis removed from this browser.");
  };

  return (
    <section className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white" aria-labelledby="resume-discovery-title">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="resume-discovery-title" className="text-xl font-semibold text-slate-900">Find matching jobs with your resume</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Upload your resume and we’ll use your skills and experience to find relevant opportunities in the Philippines. Extracted details stay in memory and clear when you leave this page.
            </p>
          </div>
          {profile && (
            <button
              type="button"
              onClick={clearResume}
              className="text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
            >
              Remove resume analysis
            </button>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {!profile ? (
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold text-slate-900">Start with your resume</h3>
              <p className="mt-1 text-sm text-slate-600">
                Upload a PDF, DOCX, or TXT resume up to 8 MB. JobUp checks that it contains resume information; the original file is not saved.
              </p>
            </div>
            <label className={`inline-flex cursor-pointer items-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 ${analyzing ? "pointer-events-none opacity-60" : ""}`}>
              {analyzing ? "Analyzing resume..." : "Upload resume"}
              <input
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={(event) => void handleUpload(event)}
                disabled={analyzing}
                className="sr-only"
              />
            </label>
          </div>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                {profile.name && <p className="text-sm text-slate-600">{profile.name}</p>}
                <p className="text-sm font-semibold text-slate-900">{profile.fileName}</p>
                <p className="mt-1 text-sm text-slate-600">
                  Based on your resume, we found jobs related to your skills and experience.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className={`cursor-pointer text-sm font-semibold text-indigo-700 hover:text-indigo-900 ${analyzing ? "pointer-events-none opacity-60" : ""}`}>
                  {analyzing ? "Analyzing..." : "Replace resume"}
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    onChange={(event) => void handleUpload(event)}
                    disabled={analyzing}
                    className="sr-only"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setSearchAttempt((attempt) => attempt + 1)}
                  disabled={searching}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {searching ? "Finding jobs..." : "Refresh matches"}
                </button>
              </div>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Likely roles", profile.roles],
                ["Skills & technologies", [...new Set([...profile.skills, ...profile.technologies])]],
                ["Experience & education", [...profile.experience, ...profile.education]],
                ["Certifications", profile.certifications],
                ["Projects", profile.projects],
                ["Professional summary", profile.summary],
                ["Relevant keywords", profile.keywords],
              ].filter(([, items]) => items.length > 0).map(([label, items]) => (
                <div key={label as string} className="min-w-0 border-l-2 border-emerald-200 pl-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label as string}</p>
                  <p className="mt-1 line-clamp-2 break-words text-sm text-slate-800">{(items as string[]).join(" · ")}</p>
                </div>
              ))}
            </div>

            {searching ? (
              <div className="border-t border-slate-100 py-8 text-center text-sm text-slate-600" role="status">
                <span aria-hidden="true" className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-emerald-700/20 border-t-emerald-700 align-[-3px]" />
                Searching live Philippine listings for matching and related roles...
              </div>
            ) : matches.length > 0 ? (
              <div className="grid gap-4 border-t border-slate-100 pt-5 lg:grid-cols-2">
                {matches.map((match) => <RecommendationCard key={match.job.id} match={match} />)}
              </div>
            ) : (
              !error && (
                <div className="border-t border-slate-100 py-8 text-center text-sm text-slate-600">
                  {userFacingErrorMessage("NO_RESULTS")}
                </div>
              )
            )}
          </>
        )}

        {error && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">
            <p className="flex items-center gap-2">
              <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-200 font-bold">!</span>
              <span><span className="font-semibold">{error.title}</span><span className="mt-1 block">{error.message}</span></span>
            </p>
            {error.retryable && (
              <button
                type="button"
                onClick={() => setSearchAttempt((attempt) => attempt + 1)}
                disabled={searching}
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60"
              >
                {searching ? "Trying again..." : "Try again"}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
