import { UserFacingError, userFacingErrorMessage } from "@/lib/userFacingErrors";

export const APPLICATIONS_UPDATED_EVENT = "jobup-applications-updated";

export const applicationStatuses = [
  "In Progress",
  "Submitted",
  "Interview",
  "Accepted",
  "Rejected",
] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

export type TrackedApplication = {
  id: number;
  job_id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  status: ApplicationStatus;
  applied_at: string;
};

export type TrackApplicationInput = Omit<TrackedApplication, "id" | "status" | "applied_at">;

function emitApplicationsUpdated() {
  window.dispatchEvent(new Event(APPLICATIONS_UPDATED_EVENT));
}

async function readErrorCode(response: Response): Promise<never> {
  const payload = (await response.json().catch(() => null)) as { code?: unknown } | null;
  const code = payload?.code;
  const knownCode = typeof code === "string" && Object.prototype.hasOwnProperty.call(
    {
      AUTH_REQUIRED: true,
      APPLICATIONS_UNAVAILABLE: true,
      APPLICATION_NOT_FOUND: true,
      INVALID_APPLICATION: true,
    },
    code,
  );
  if (knownCode) {
    throw new Error(userFacingErrorMessage(code));
  }
  throw new UserFacingError("APPLICATIONS_UNAVAILABLE");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { ...init, cache: "no-store" });
  } catch {
    throw new UserFacingError("APPLICATIONS_UNAVAILABLE");
  }
  if (!response.ok) return readErrorCode(response);
  try {
    return await response.json() as T;
  } catch {
    throw new UserFacingError("APPLICATIONS_UNAVAILABLE");
  }
}

export async function getApplications(): Promise<TrackedApplication[]> {
  const applications = await request<TrackedApplication[]>("/api/applications");
  if (!Array.isArray(applications)) throw new UserFacingError("APPLICATIONS_UNAVAILABLE");
  return applications;
}

export async function trackApplication(input: TrackApplicationInput): Promise<TrackedApplication> {
  const application = await request<TrackedApplication>("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  emitApplicationsUpdated();
  return application;
}

export async function updateApplicationStatus(
  id: number,
  status: ApplicationStatus,
): Promise<TrackedApplication> {
  const application = await request<TrackedApplication>(`/api/applications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  emitApplicationsUpdated();
  return application;
}