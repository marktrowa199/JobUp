"use client";

import { useState } from "react";
import type { Job } from "@/lib/jobSearch";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import { trackApplication } from "@/services/applicationsApi";
import { userFacingErrorMessage } from "@/lib/userFacingErrors";

export function ApplicationLink({ job, className }: { job: Job; className: string }) {
  const [tracking, setTracking] = useState(false);
  const { notify } = useNotifications();

  const handleApply = () => {
    if (tracking) return;
    setTracking(true);
    void trackApplication({
      job_id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      url: job.url,
    }).then(() => {
      notify("success", "Application tracked as In Progress. Update its status in My Applications after you apply.");
    }).catch(() => {
      notify("warning", userFacingErrorMessage("APPLICATION_TRACK_FAILED"));
    }).finally(() => {
      setTracking(false);
    });
  };

  return (
    <a
      href={job.url}
      target="_blank"
      rel="noreferrer"
      aria-busy={tracking}
      onClick={handleApply}
      className={className}
    >
      {tracking && <span aria-hidden="true" className="mr-2 inline-block size-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current align-[-2px]" />}
      {tracking ? "Saving..." : "Apply & track"}
    </a>
  );
}