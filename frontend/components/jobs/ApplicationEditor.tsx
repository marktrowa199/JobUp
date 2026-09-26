"use client";

import { useState, type FormEvent } from "react";
import {
  applicationStatuses,
  interviewNextActions,
  type ApplicationFields,
  type ApplicationStatus,
  type InterviewNextAction,
  type TrackedApplication,
} from "@/services/applicationsApi";

type ApplicationEditorProps = {
  initial?: Partial<TrackedApplication>;
  onClose: () => void;
  onSave: (fields: ApplicationFields) => Promise<void>;
  saving: boolean;
};

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const inputClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export function ApplicationEditor({ initial, onClose, onSave, saving }: ApplicationEditorProps) {
  const [status, setStatus] = useState<ApplicationStatus>(initial?.status ?? "Applications Submitted");
  const [nextAction, setNextAction] = useState<InterviewNextAction | "">(initial?.next_action ?? "");
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const isEditing = Boolean(initial?.id);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const field = (name: string, fallback = "") => String(form.get(name) ?? fallback).trim();
    await onSave({
      ...(initial?.job_id ? { job_id: initial.job_id } : {}),
      title: field("title", initial?.title),
      company: field("company", initial?.company),
      location: field("location", initial?.location ?? "Not specified"),
      url: field("url", initial?.url),
      status,
      next_action: status === "Interview" && nextAction ? nextAction : null,
      application_date: field("application_date", initial?.application_date ?? initial?.applied_at?.slice(0, 10) ?? today()),
      salary: field("salary", initial?.salary),
      company_website: field("company_website", initial?.company_website),
      contact_person: field("contact_person", initial?.contact_person),
      contact_information: field("contact_information", initial?.contact_information),
      notes: field("notes", initial?.notes),
      ...(initial?.job_id && !isEditing ? { allow_duplicate: allowDuplicate } : {}),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="application-editor-title" className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="application-editor-title" className="text-xl font-semibold text-slate-900">{isEditing ? "Edit Application" : "Add to My Applications"}</h2>
            <p className="mt-1 text-sm text-slate-600">{isEditing ? "Update your application details." : "Save the essentials now. You can add more details later."}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close application form" className="rounded-lg px-2 py-1 text-xl text-slate-500 hover:bg-slate-100">×</button>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Company name
              <input name="company" required maxLength={250} defaultValue={initial?.company ?? ""} className={inputClass} />
            </label>
            <label className="text-sm font-medium text-slate-700">Position / job title
              <input name="title" required maxLength={250} defaultValue={initial?.title ?? ""} className={inputClass} />
            </label>
            <label className="text-sm font-medium text-slate-700">Application status
              <select value={status} onChange={(event) => setStatus(event.target.value as ApplicationStatus)} className={inputClass}>
                {applicationStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            {status === "Interview" && (
              <label className="text-sm font-medium text-slate-700">Next action (optional)
                <select value={nextAction} onChange={(event) => setNextAction(event.target.value as InterviewNextAction | "")} className={inputClass}>
                  <option value="">Choose an action</option>
                  {interviewNextActions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            )}
            <label className="text-sm font-medium text-slate-700">Application date
              <input name="application_date" type="date" required defaultValue={initial?.application_date ?? (initial?.applied_at ? initial.applied_at.slice(0, 10) : today())} className={inputClass} />
            </label>

            {isEditing && (
              <>
                <label className="text-sm font-medium text-slate-700">Salary (optional)
                  <input name="salary" maxLength={250} placeholder="e.g. PHP 40,000 to 50,000 / month" defaultValue={initial?.salary ?? ""} className={inputClass} />
                </label>
                <label className="text-sm font-medium text-slate-700">Company website (optional)
                  <input name="company_website" type="url" maxLength={2048} placeholder="https://company.com" defaultValue={initial?.company_website ?? ""} className={inputClass} />
                </label>
                <label className="text-sm font-medium text-slate-700">Contact person (optional)
                  <input name="contact_person" maxLength={200} defaultValue={initial?.contact_person ?? ""} className={inputClass} />
                </label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">Contact information (optional)
                  <input name="contact_information" maxLength={500} placeholder="Email address or phone number" defaultValue={initial?.contact_information ?? ""} className={inputClass} />
                </label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">Reference link / original job posting (optional)
                  <input name="url" type="url" maxLength={2048} placeholder="https://job-posting.com" defaultValue={initial?.url ?? ""} className={inputClass} />
                </label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">Location (optional)
                  <input name="location" maxLength={250} defaultValue={initial?.location ?? ""} className={inputClass} />
                </label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">Notes (optional)
                  <textarea name="notes" maxLength={5000} rows={4} defaultValue={initial?.notes ?? ""} className={inputClass} />
                </label>
              </>
            )}
          </div>

          {!isEditing && initial?.job_id && (
            <details className="rounded-lg border border-slate-200 px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium text-slate-700">More options</summary>
              <label className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={allowDuplicate} onChange={(event) => setAllowDuplicate(event.target.checked)} className="mt-1 accent-indigo-600" />
                Save as a separate application if this job is already in my tracker
              </label>
            </details>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60">{saving ? "Saving..." : isEditing ? "Save Application" : "Add Application"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
