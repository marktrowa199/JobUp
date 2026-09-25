"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { normalizeJobFromApi, type Job } from "@/lib/jobSearch";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getRoleSearchQueries,
  rankResumeJob,
  type ResumeJobMatch,
  type ResumeProfile,
} from "@/lib/resumeDiscovery";
import { searchJobsApi } from "@/services/jobApi";
import { useNotifications } from "@/components/notifications/NotificationProvider";

const RESUME_PROFILE_KEY = "jobup-resume-profile";
const RESUME_PROFILE_EVENT = "jobup-resume-profile-change";

function subscribeToResumeProfile(onChange: () => void, profileKey: string) {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === profileKey) onChange();
  };
  window.addEventListener("storage", handleStorageChange);
  window.addEventListener(RESUME_PROFILE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener(RESUME_PROFILE_EVENT, onChange);
  };
}

function getResumeProfileSnapshot(profileKey: string) {
  return window.localStorage.getItem(profileKey);
}

function getServerResumeProfileSnapshot() {
  return null;
}

function isResumeProfile(value: unknown): value is ResumeProfile {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ResumeProfile>;
  return typeof candidate.fileName === "string"
    && (typeof candidate.name === "string" || candidate.name === null)
    && !!candidate.contact && typeof candidate.contact === "object"
    && [
    candidate.roles,
    candidate.skills,
    candidate.technologies,
    candidate.experience,
    candidate.education,
    candidate.certifications,
    candidate.projects,
    candidate.summary,
    candidate.keywords,
  ].every(Array.isArray);
}

function parseResumeProfile(value: string | null): ResumeProfile | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return isResumeProfile(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function RecommendationCard({ match }: { match: ResumeJobMatch }) {
  const { job, score, matchedSkills, reason } = match;
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
        {job.url ? (
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Apply
          </a>
        ) : (
          <span className="shrink-0 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500">
            Link unavailable
          </span>
        )}
      </div>
    </article>
  );
}

export function ResumeDiscovery() {
  const { user } = useAuth();
  const profileKey = `${RESUME_PROFILE_KEY}:${user?.id ?? "anonymous"}`;
  const subscribe = useCallback(
    (onChange: () => void) => subscribeToResumeProfile(onChange, profileKey),
    [profileKey],
  );
  const getSnapshot = useCallback(() => getResumeProfileSnapshot(profileKey), [profileKey]);
  const savedProfile = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerResumeProfileSnapshot,
  );
  const profile = parseResumeProfile(savedProfile);
  const [matches, setMatches] = useState<ResumeJobMatch[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [searchAttempt, setSearchAttempt] = useState(0);
  const { notify } = useNotifications();

  useEffect(() => {
    const parsedProfile = parseResumeProfile(savedProfile);
    if (!parsedProfile) return;
    const activeProfile: ResumeProfile = parsedProfile;
    let cancelled = false;
    const roles = getRoleSearchQueries(activeProfile);

    async function loadMatches() {
      setSearching(true);
      setError(null);
      const results = await Promise.allSettled(
        roles.map((keyword) => searchJobsApi({ keyword, location: "Philippines" })),
      );
      if (cancelled) return;

      const responses = results.filter((result) => result.status === "fulfilled");
      if (responses.length === 0) {
        const firstFailure = results.find((result) => result.status === "rejected");
        setMatches([]);
        setError({
          title: "Recommendations unavailable",
          message: firstFailure?.status === "rejected" && firstFailure.reason instanceof Error
            ? firstFailure.reason.message
            : "Job recommendations are temporarily unavailable. Please try again.",
        });
        setSearching(false);
        return;
      }

      const uniqueJobs = new Map<string, Job>();
      for (const result of responses) {
        if (result.status !== "fulfilled") continue;
        for (const item of result.value.jobs) {
          const job = normalizeJobFromApi(item);
          const key = job.url || `${job.title}|${job.company}|${job.location}`.toLowerCase();
          if (!uniqueJobs.has(key)) uniqueJobs.set(key, job);
        }
      }

      const ranked = [...uniqueJobs.values()]
        .map((job) => rankResumeJob(job, activeProfile, roles))
        .sort((first, second) => second.score - first.score)
        .slice(0, 8);
      setMatches(ranked);
      if (responses.length < results.length) {
        setError({
          title: "Some role searches failed",
          message: "These recommendations include the results that were available.",
        });
      }
      setSearching(false);
    }

    void loadMatches();
    return () => { cancelled = true; };
  }, [savedProfile, searchAttempt]);

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
      const message = "Upload a PDF, DOCX, or TXT resume. Legacy DOC files are not supported.";
      setError({ title: "Unsupported file type", message });
      notify("error", message);
      return;
    }

    setAnalyzing(true);
    setSearching(false);
    setError(null);
    setMatches([]);
    window.localStorage.removeItem(profileKey);
    window.dispatchEvent(new Event(RESUME_PROFILE_EVENT));
    const form = new FormData();
    form.set("resume", file);

    try {
      const response = await fetch("/api/resume/analyze", { method: "POST", body: form, cache: "no-store" });
      const payload = await response.json() as { profile?: ResumeProfile; message?: string; code?: string };
      if (!response.ok || !payload.profile) {
        if (payload.code === "INVALID_RESUME") {
          const message = "We couldn't detect a valid resume in this file. Please upload a resume or CV to use Resume-Powered Discovery.";
          setError({ title: "Invalid Resume", message });
          notify("error", `Invalid Resume. ${message}`);
          return;
        }
        throw new Error(payload.message ?? "We couldn't analyze this resume.");
      }
      window.localStorage.setItem(profileKey, JSON.stringify(payload.profile));
      window.dispatchEvent(new Event(RESUME_PROFILE_EVENT));
      notify("success", "Resume analyzed. Finding matching jobs across the Philippines.");
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "We couldn't analyze this resume.";
      setError({ title: "Upload failed", message });
      notify("error", message);
    } finally {
      setAnalyzing(false);
    }
  };

  const clearResume = () => {
    window.localStorage.removeItem(profileKey);
    window.dispatchEvent(new Event(RESUME_PROFILE_EVENT));
    setMatches([]);
    setSearching(false);
    setError(null);
    notify("info", "Saved resume analysis removed from this browser.");
  };

  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-sm" aria-labelledby="resume-discovery-title">
      <div className="border-b border-emerald-100 bg-emerald-50/70 px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Personalized for you</p>
            <h2 id="resume-discovery-title" className="mt-2 text-2xl font-bold text-slate-900">Resume-Powered Discovery</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Find real Philippine job listings that fit your skills, experience, and related career paths.
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

      <div className="p-5 sm:p-7">
        {!profile ? (
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold text-slate-900">Start with your resume</h3>
              <p className="mt-1 text-sm text-slate-600">
                Upload a text-based PDF or TXT file, up to 8 MB. The original file is not saved.
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
                Searching live Philippine listings for matching and related roles...
              </div>
            ) : matches.length > 0 ? (
              <div className="grid gap-4 border-t border-slate-100 pt-5 lg:grid-cols-2">
                {matches.map((match) => <RecommendationCard key={match.job.id} match={match} />)}
              </div>
            ) : (
              !error && (
                <div className="border-t border-slate-100 py-8 text-center text-sm text-slate-600">
                  No matching jobs were found right now. Try refreshing or use Job Search below for another title.
                </div>
              )
            )}
          </>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role={error.title === "Invalid Resume" ? "alert" : "status"}>
            <p className="font-semibold">{error.title}</p>
            <p className="mt-1">{error.message}</p>
          </div>
        )}
      </div>
    </section>
  );
}
