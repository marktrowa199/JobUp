import { UserFacingError } from "@/lib/userFacingErrors";

export const APPLICATIONS_UPDATED_EVENT = "jobup-applications-updated";

export const applicationStatuses = [
  "Applications Submitted",
  "In Progress",
  "Interview",
  "Accepted",
  "Rejected",
] as const;

export const interviewNextActions = [
  "Prepare Interview",
  "Waiting",
  "Follow Up",
  "Send Email",
  "Decide",
] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];
export type InterviewNextAction = (typeof interviewNextActions)[number];

export type ApplicationFields = {
  job_id?: string;
  title: string;
  company: string;
  location: string;
  url: string;
  status: ApplicationStatus;
  next_action: InterviewNextAction | null;
  application_date: string;
  salary: string;
  company_website: string;
  contact_person: string;
  contact_information: string;
  notes: string;
  allow_duplicate?: boolean;
};

export type TrackedApplication = Omit<ApplicationFields, "application_date" | "allow_duplicate"> & {
  id: number;
  job_id: string;
  application_date: string;
  applied_at: string;
};

function normalizeApplication(application: Omit<TrackedApplication, "application_date"> & { application_date?: string }): TrackedApplication {
  return {
    ...application,
    application_date: application.application_date ?? application.applied_at.slice(0, 10),
    next_action: application.next_action ?? null,
    salary: application.salary ?? "",
    company_website: application.company_website ?? "",
    contact_person: application.contact_person ?? "",
    contact_information: application.contact_information ?? "",
    notes: application.notes ?? "",
    url: application.url ?? "",
  };
}

function emitApplicationsUpdated() {
  window.dispatchEvent(new Event(APPLICATIONS_UPDATED_EVENT));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { ...init, cache: "no-store" });
  } catch {
    throw new UserFacingError("APPLICATIONS_UNAVAILABLE");
  }
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { code?: unknown } | null;
    const code = payload?.code;
    if (code === "APPLICATION_NOT_FOUND") throw new UserFacingError("APPLICATION_NOT_FOUND");
    if (code === "AUTH_REQUIRED") throw new UserFacingError("AUTH_REQUIRED");
    if (code === "INVALID_APPLICATION") throw new UserFacingError("INVALID_APPLICATION");
    throw new UserFacingError("APPLICATIONS_UNAVAILABLE");
  }
  if (response.status === 204) return undefined as T;
  try {
    return await response.json() as T;
  } catch {
    throw new UserFacingError("APPLICATIONS_UNAVAILABLE");
  }
}

export async function getApplications(): Promise<TrackedApplication[]> {
  const applications = await request<Array<Omit<TrackedApplication, "application_date"> & { application_date?: string }>>("/api/applications");
  if (!Array.isArray(applications)) throw new UserFacingError("APPLICATIONS_UNAVAILABLE");
  return applications.map(normalizeApplication);
}

export async function createApplication(input: ApplicationFields): Promise<TrackedApplication> {
  const application = await request<Omit<TrackedApplication, "application_date"> & { application_date?: string }>("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  emitApplicationsUpdated();
  return normalizeApplication(application);
}

export async function updateApplication(id: number, input: Partial<ApplicationFields>): Promise<TrackedApplication> {
  const application = await request<Omit<TrackedApplication, "application_date"> & { application_date?: string }>(`/api/applications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  emitApplicationsUpdated();
  return normalizeApplication(application);
}

export async function deleteApplication(id: number): Promise<void> {
  await request<void>(`/api/applications/${id}`, { method: "DELETE" });
  emitApplicationsUpdated();
}
