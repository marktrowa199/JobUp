"use client";

import { useEffect, useState } from "react";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import {
  APPLICATIONS_UPDATED_EVENT,
  applicationStatuses,
  getApplications,
  updateApplicationStatus,
  type ApplicationStatus,
  type TrackedApplication,
} from "@/services/applicationsApi";
import { UserFacingError, userFacingErrorMessage } from "@/lib/userFacingErrors";

function formatAppliedDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

const statusStyles: Record<ApplicationStatus, string> = {
  "In Progress": "border-amber-200 bg-amber-50 text-amber-800",
  Submitted: "border-sky-200 bg-sky-50 text-sky-800",
  Interview: "border-indigo-200 bg-indigo-50 text-indigo-800",
  Accepted: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Rejected: "border-rose-200 bg-rose-50 text-rose-800",
};

export function ApplicationOverview() {
  const [applications, setApplications] = useState<TrackedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [savingIds, setSavingIds] = useState<number[]>([]);
  const { notify } = useNotifications();

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const records = await getApplications();
        if (active) setApplications(records);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof UserFacingError
          ? loadError.message
          : userFacingErrorMessage("APPLICATIONS_UNAVAILABLE"));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();

    const refresh = () => setRefreshKey((current) => current + 1);
    window.addEventListener(APPLICATIONS_UPDATED_EVENT, refresh);
    return () => {
      active = false;
      window.removeEventListener(APPLICATIONS_UPDATED_EVENT, refresh);
    };
  }, [refreshKey]);

  const handleStatusChange = async (application: TrackedApplication, status: ApplicationStatus) => {
    setSavingIds((current) => [...current, application.id]);
    try {
      const updated = await updateApplicationStatus(application.id, status);
      setApplications((current) => current.map((item) => item.id === updated.id ? updated : item));
      notify("success", "Application status updated.");
    } catch (updateError) {
      notify("warning", updateError instanceof UserFacingError
        ? updateError.message
        : userFacingErrorMessage("APPLICATIONS_UNAVAILABLE"));
    } finally {
      setSavingIds((current) => current.filter((id) => id !== application.id));
    }
  };

  const submittedCount = applications.filter((application) => application.status !== "In Progress").length;
  const inProgressCount = applications.filter((application) => application.status === "In Progress").length;
  const interviewCount = applications.filter((application) => application.status === "Interview").length;

  return (
    <section id="my-applications" className="border-t border-slate-200 pt-9" aria-labelledby="applications-title">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="applications-title" className="text-2xl font-bold text-slate-900">My Applications</h2>
          <p className="mt-1 text-sm text-slate-600">Keep track of the opportunities you are pursuing.</p>
        </div>
        {applications.length > 0 && <p className="text-sm text-slate-500">{applications.length} tracked</p>}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-3" role="status" aria-label="Loading application overview">
          {[0, 1, 2].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-slate-200" />)}
        </div>
      ) : error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">
          <p className="flex items-center gap-2"><span aria-hidden="true" className="font-bold">!</span>{error}</p>
          <button type="button" onClick={() => setRefreshKey((current) => current + 1)} className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-semibold hover:bg-amber-100">Try again</button>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Applications Submitted", value: submittedCount, tone: "text-sky-800" },
              { label: "In Progress", value: inProgressCount, tone: "text-amber-800" },
              { label: "Interviews", value: interviewCount, tone: "text-indigo-800" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-sm text-slate-600">{stat.label}</p>
                <p className={`mt-1 text-2xl font-semibold ${stat.tone}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-7">
            <h3 className="mb-2 text-base font-semibold text-slate-900">Recent Applications</h3>
            {applications.length === 0 ? (
              <p className="border-t border-slate-200 py-5 text-sm text-slate-600">Applications you track will appear here.</p>
            ) : (
              <ul className="divide-y divide-slate-200 border-y border-slate-200">
                {applications.slice(0, 6).map((application) => (
                  <li key={application.id} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                    <div className="min-w-0">
                      <a href={application.url} target="_blank" rel="noreferrer" className="font-semibold text-slate-900 underline decoration-transparent underline-offset-2 transition hover:decoration-current">{application.title}</a>
                      <p className="mt-0.5 truncate text-sm text-slate-600">{application.company} · {application.location}</p>
                    </div>
                    <time dateTime={application.applied_at} className="text-sm text-slate-500">{formatAppliedDate(application.applied_at)}</time>
                    <label className="flex items-center gap-2 text-sm">
                      <span className="sr-only">Status for {application.title}</span>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[application.status]}`}>{application.status}</span>
                      <select
                        aria-label={`Update status for ${application.title}`}
                        value={application.status}
                        disabled={savingIds.includes(application.id)}
                        onChange={(event) => void handleStatusChange(application, event.target.value as ApplicationStatus)}
                        className="max-w-36 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 disabled:opacity-50"
                      >
                        {applicationStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}