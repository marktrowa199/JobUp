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
  applicationId?: string;
  title: string;
  company: string;
  companyWebsite?: string;
  location: string;
  description?: string;
  salary?: string;
  jobType?: string;
  remote?: string;
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
  nextPageToken: string | null;
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
  page?: number;
  pageToken?: string | null;
}): Promise<JobSearchResponse> {
  let response: Response;
  try {
    response = await fetch("/api/jobs/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keywords: params.keyword,
        location: params.location,
        page: params.page ?? 1,
        pageToken: params.pageToken ?? null,
      }),
      cache: "no-store",
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Job search request failed.", {
        name: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message.slice(0, 200) : "Unknown error",
      });
    }
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
    page?: number;
    total?: number;
    locationBroadened?: boolean;
    nextPageToken?: string | null;
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
    page: typeof payload.page === "number" ? payload.page : params.page ?? 1,
    limit: payload.jobs.length,
    total: typeof payload.total === "number" ? payload.total : payload.jobs.length,
    jobs: payload.jobs,
    locationBroadened: payload.locationBroadened ?? false,
    nextPageToken: payload.nextPageToken ?? null,
  };
}

export async function getJob(jobId: string): Promise<JobDetailsResponse> {
  const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("We couldn't load this job right now. Please try again in a moment.");
  }

  return response.json();
}
