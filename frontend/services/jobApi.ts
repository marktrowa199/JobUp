import {
  UserFacingError,
  userFacingErrorMessage,
  userFacingErrors,
} from "@/lib/userFacingErrors";

export type JobSearchFilters = {
  pay: string;
  jobType: string;
  remote: string;
  classification: string;
  listingTime: string;
};

export type JobApiItem = {
  id: string;
  title: string;
  company: string;
  location: string;
  description?: string;
  salary?: string;
  jobType?: string;
  source: string;
  url: string;
  postedDate?: string;
};

export type JobSearchResponse = {
  keyword: string;
  location: string;
  page: number;
  limit: number;
  total: number;
  jobs: JobApiItem[];
  locationBroadened: boolean;
};

export type JobDetailsResponse = {
  id: string;
  title: string;
  company: {
    name: string;
    description: string | null;
    website: string | null;
    industry: string | null;
  };
  location: string;
  description: string;
  salary: string;
  job_type: string;
  remote: string;
  posted_date: string;
  source: string;
  url: string;
};

export async function searchJobsApi(params: {
  keyword: string;
  location: string;
  jobType?: string;
  remote?: string;
}): Promise<JobSearchResponse> {
  let response: Response;
  try {
    response = await fetch("/api/jobs/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keywords: params.keyword,
        location: params.location,
        jobType: params.jobType,
        remote: params.remote,
      }),
      cache: "no-store",
    });
  } catch {
    throw new UserFacingError("JOB_SEARCH_NETWORK_ERROR");
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { code?: unknown } | null;
    const code = payload?.code;
    if (typeof code === "string" && Object.prototype.hasOwnProperty.call(userFacingErrors, code)) {
      throw new UserFacingError(code as ConstructorParameters<typeof UserFacingError>[0]);
    }
    throw new Error(userFacingErrorMessage(code));
  }

  let payload: {
    jobs: JobApiItem[];
    keyword?: string;
    location?: string;
    locationBroadened?: boolean;
  };
  try {
    payload = await response.json();
    if (!Array.isArray(payload.jobs)) throw new Error("Invalid search response");
  } catch {
    throw new UserFacingError("JOB_SEARCH_INVALID_RESPONSE");
  }
  return {
    keyword: payload.keyword ?? params.keyword,
    location: payload.location ?? params.location ?? "Philippines",
    page: 1,
    limit: payload.jobs.length,
    total: payload.jobs.length,
    jobs: payload.jobs,
    locationBroadened: payload.locationBroadened ?? false,
  };
}

export async function getJob(jobId: string): Promise<JobDetailsResponse> {
  const response = await fetch(`http://127.0.0.1:8000/api/jobs/${encodeURIComponent(jobId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("We couldn't load this job right now. Please try again in a moment.");
  }

  return response.json();
}
