"use client";

import { useEffect, useState } from "react";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import { ApplicationEditor } from "@/components/jobs/ApplicationEditor";
import {
  APPLICATIONS_UPDATED_EVENT,
  applicationStatuses,
  interviewNextActions,
  createApplication,
  deleteApplication,
  getApplications,
  updateApplication,
  type ApplicationFields,
  type ApplicationStatus,
  type InterviewNextAction,
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
  "Applications Submitted": "border-sky-200 bg-sky-50 text-sky-800",
  "In Progress": "border-amber-200 bg-amber-50 text-amber-800",
  Interview: "border-indigo-200 bg-indigo-50 text-indigo-800",
  Accepted: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Rejected: "border-rose-200 bg-rose-50 text-rose-800",
};

type EditorState = { mode: "new" } | { mode: "edit"; application: TrackedApplication };

export function ApplicationOverview() {
  const [applications, setApplications] = useState<TrackedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [savingIds, setSavingIds] = useState<number[]>([]);
  const [selectedSection, setSelectedSection] = useState<"all" | "in-progress" | "interviews">("all");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [savingEditor, setSavingEditor] = useState(false);
  const [details, setDetails] = useState<TrackedApplication | null>(null);
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

  const saveApplication = async (fields: ApplicationFields) => {
    setSavingEditor(true);
    try {
      const saved = editor?.mode === "edit"
        ? await updateApplication(editor.application.id, fields)
        : await createApplication(fields);
      setApplications((current) => editor?.mode === "edit"
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [saved, ...current.filter((item) => item.id !== saved.id)]);
      setDetails((current) => current?.id === saved.id ? saved : current);
      setEditor(null);
      notify("success", editor?.mode === "edit" ? "Application updated." : "Application added to your tracker.");
    } catch (saveError) {
      notify("warning", saveError instanceof UserFacingError
        ? saveError.message
        : userFacingErrorMessage("APPLICATION_TRACK_FAILED"));
    } finally {
      setSavingEditor(false);
    }
  };

  const updateFields = async (application: TrackedApplication, fields: Partial<ApplicationFields>) => {
    setSavingIds((current) => [...current, application.id]);
    try {
      const updated = await updateApplication(application.id, fields);
      setApplications((current) => current.map((item) => item.id === updated.id ? updated : item));
      setDetails((current) => current?.id === updated.id ? updated : current);
      notify("success", "Application updated.");
    } catch (updateError) {
      notify("warning", updateError instanceof UserFacingError
        ? updateError.message
        : userFacingErrorMessage("APPLICATIONS_UNAVAILABLE"));
    } finally {
      setSavingIds((current) => current.filter((id) => id !== application.id));
    }
  };

  const removeApplication = async (application: TrackedApplication) => {
    if (!window.confirm(`Delete your application for ${application.title} at ${application.company}?`)) return;
    setSavingIds((current) => [...current, application.id]);
    try {
      await deleteApplication(application.id);
      setApplications((current) => current.filter((item) => item.id !== application.id));
      setDetails(null);
      notify("success", "Application deleted.");
    } catch (deleteError) {
      notify("warning", deleteError instanceof UserFacingError
        ? deleteError.message
        : userFacingErrorMessage("APPLICATIONS_UNAVAILABLE"));
    } finally {
      setSavingIds((current) => current.filter((id) => id !== application.id));
    }
  };

  const submittedCount = applications.length;
  const inProgressCount = applications.filter((application) => application.status === "In Progress").length;
  const interviewCount = applications.filter((application) => application.status === "Interview").length;
  const visibleApplications = applications.filter((application) => {
    if (selectedSection === "in-progress") return application.status === "In Progress";
    if (selectedSection === "interviews") return application.status === "Interview";
    return true;
  });
  const sectionTitle = selectedSection === "in-progress"
    ? "In Progress"
    : selectedSection === "interviews"
      ? "Interviews"
      : "Applications Submitted";

  return (
    <section id="my-applications" className="border-t border-slate-200 pt-9" aria-labelledby="applications-title">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="applications-title" className="text-2xl font-bold text-slate-900">My Applications</h2>
          <p className="mt-1 text-sm text-slate-600">Keep track of the opportunities you are pursuing.</p>
        </div>
        <button type="button" onClick={() => setEditor({ mode: "new" })} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">
          Add application
        </button>
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
              <button
                key={stat.label}
                type="button"
                aria-pressed={
                  (stat.label === "Applications Submitted" && selectedSection === "all") ||
                  (stat.label === "In Progress" && selectedSection === "in-progress") ||
                  (stat.label === "Interviews" && selectedSection === "interviews")
                }
                onClick={() => setSelectedSection(
                  stat.label === "In Progress" ? "in-progress" : stat.label === "Interviews" ? "interviews" : "all",
                )}
                className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50/30 aria-pressed:border-indigo-300 aria-pressed:ring-1 aria-pressed:ring-indigo-200"
              >
                <p className="text-sm text-slate-600">{stat.label}</p>
                <p className={`mt-1 text-2xl font-semibold ${stat.tone}`}>{stat.value}</p>
              </button>
            ))}
          </div>

          <div className="mt-7">
            <h3 className="mb-2 text-base font-semibold text-slate-900">{sectionTitle}</h3>
            {visibleApplications.length === 0 ? (
              <p className="border-t border-slate-200 py-5 text-sm text-slate-600">
                {applications.length === 0
                  ? "Applications you track will appear here. Add one manually or from Job Search."
                  : selectedSection === "in-progress"
                    ? "You have no applications currently in progress."
                    : selectedSection === "interviews"
                      ? "No interviews are recorded yet. Update an application status to Interview when you receive an invitation."
                      : "You have no applications in this section."}
              </p>
            ) : (
              <ul className="divide-y divide-slate-200 border-y border-slate-200">
                {visibleApplications.map((application) => (
                  <li key={application.id} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <button type="button" onClick={() => setDetails(application)} className="min-w-0 text-left">
                      <span className="block truncate font-semibold text-slate-900 hover:text-indigo-700">{application.company}</span>
                      <span className="mt-0.5 block truncate text-sm text-slate-700">{application.title}</span>
                      <span className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-500">
                        <span>{formatAppliedDate(application.application_date)}</span>
                        {application.salary && <span>{application.salary}</span>}
                        {application.next_action && <span>Next: {application.next_action}</span>}
                      </span>
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        aria-label={`Application status for ${application.title} at ${application.company}`}
                        value={application.status}
                        disabled={savingIds.includes(application.id)}
                        onChange={(event) => void updateFields(application, { status: event.target.value as ApplicationStatus })}
                        className={`max-w-48 rounded-full border px-2.5 py-1.5 text-xs font-semibold ${statusStyles[application.status]} disabled:opacity-50`}
                      >
                        {applicationStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                      {application.status === "Interview" && (
                        <select
                          aria-label={`Next action for ${application.title}`}
                          value={application.next_action ?? ""}
                          disabled={savingIds.includes(application.id)}
                          onChange={(event) => void updateFields(application, { next_action: (event.target.value || null) as InterviewNextAction | null })}
                          className="max-w-44 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 disabled:opacity-50"
                        >
                          <option value="">Next action</option>
                          {interviewNextActions.map((action) => <option key={action} value={action}>{action}</option>)}
                        </select>
                      )}
                      <button type="button" onClick={() => setEditor({ mode: "edit", application })} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Edit</button>
                      <button type="button" disabled={savingIds.includes(application.id)} onClick={() => void removeApplication(application)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {editor && (
        <ApplicationEditor
          initial={editor.mode === "edit" ? editor.application : undefined}
          onClose={() => setEditor(null)}
          onSave={saveApplication}
          saving={savingEditor}
        />
      )}

      {details && (
        <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetails(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="application-details-title" className="my-auto max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="application-details-title" className="text-xl font-semibold text-slate-900">{details.company}</h3>
                <p className="mt-1 text-slate-700">{details.title}</p>
              </div>
              <button type="button" onClick={() => setDetails(null)} aria-label="Close application details" className="rounded-lg px-2 py-1 text-xl text-slate-500 hover:bg-slate-100">×</button>
            </div>
            <dl className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</dt><dd className="mt-1">{details.status}</dd></div>
              {details.next_action && <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next action</dt><dd className="mt-1">{details.next_action}</dd></div>}
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Application date</dt><dd className="mt-1">{formatAppliedDate(details.application_date)}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Salary</dt><dd className="mt-1">{details.salary || "Not provided"}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</dt><dd className="mt-1">{details.location || "Not provided"}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact person</dt><dd className="mt-1">{details.contact_person || "Not provided"}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact information</dt><dd className="mt-1 break-words">{details.contact_information || "Not provided"}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</dt><dd className="mt-1 whitespace-pre-wrap break-words">{details.notes || "No notes"}</dd></div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
              {details.url && <a href={details.url} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Open job posting</a>}
              {details.company_website && <a href={details.company_website} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Company website</a>}
              <button type="button" onClick={() => { setDetails(null); setEditor({ mode: "edit", application: details }); }} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Edit application</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
