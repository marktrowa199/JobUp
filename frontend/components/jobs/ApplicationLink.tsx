"use client";

import { useState } from "react";
import type { Job } from "@/lib/jobSearch";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import { ApplicationEditor } from "@/components/jobs/ApplicationEditor";
import { createApplication, type ApplicationFields } from "@/services/applicationsApi";
import { UserFacingError, userFacingErrorMessage } from "@/lib/userFacingErrors";

export function ApplicationLink({ job, className }: { job: Job; className: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { notify } = useNotifications();

  const save = async (fields: ApplicationFields) => {
    setSaving(true);
    try {
      await createApplication(fields);
      setIsEditing(false);
      notify("success", "Application saved or already in My Applications.");
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Could not save job application.", {
          errorName: error instanceof Error ? error.name : "UnknownError",
          errorCode: error instanceof UserFacingError ? error.code : undefined,
        });
      }
      notify("warning", error instanceof UserFacingError
        ? error.message
        : userFacingErrorMessage("APPLICATION_TRACK_FAILED"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setIsEditing(true)} className={className}>
          Add to My Applications
        </button>
        {job.url && (
          <a href={job.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-indigo-700 underline underline-offset-2 hover:text-indigo-900">
            View job posting
          </a>
        )}
      </div>
      {isEditing && (
        <ApplicationEditor
          initial={{
            job_id: job.applicationId ?? job.id,
            title: job.title,
            company: job.company,
            location: job.location,
            url: job.url,
            salary: job.pay === "Salary not specified" ? "" : job.pay,
            company_website: job.companyWebsite,
          }}
          onClose={() => setIsEditing(false)}
          onSave={save}
          saving={saving}
        />
      )}
    </>
  );
}
