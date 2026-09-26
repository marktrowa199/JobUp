import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/apiSecurity";

export const runtime = "nodejs";

type SerpApiJob = {
  job_id?: string;
  title?: string;
  company_name?: string;
  location?: string;
  description?: string;
  via?: string;
  share_link?: string;
  apply_options?: Array<{ link?: string }>;
  detected_extensions?: {
    posted_at?: string;
    schedule_type?: string;
    work_from_home?: boolean;
    salary?: string;
  };
  extensions?: string[];
};

type SearchBody = { keywords?: unknown; location?: unknown; pageToken?: unknown };

class SerpApiError extends Error {
  constructor(
    readonly kind: "http" | "invalid-json" | "invalid-response",
    readonly status?: number,
    message?: string,
  ) {
    super(message || (kind === "http" ? `SerpApi returned HTTP ${status}` : `SerpApi returned ${kind}`));
  }
}

function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeLocation(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (/^remote(?:\s*\/\s*philippines)?$/i.test(normalized)) {
    return { location: "Philippines", remoteSearch: true };
  }
  if (/philippines/i.test(normalized)) return { location: normalized, remoteSearch: false };
  return { location: `${normalized}, Philippines`, remoteSearch: false };
}

function normalizeJob(job: SerpApiJob, index: number) {
  const extensions = job.extensions ?? [];
  const details = job.detected_extensions ?? {};
  const description = text(job.description, "No description available.");
  const remote = details.work_from_home || /remote|work from home|home-based/i.test(`${job.title ?? ""} ${description}`)
    ? "Remote"
    : "Not specified";
  return {
    id: text(job.job_id, text(job.share_link, `serpapi-ph-${index}`)),
    title: text(job.title, "Not specified"),
    company: text(job.company_name, "Not specified"),
    location: text(job.location, "Philippines"),
    description,
    salary: text(details.salary, "Salary not specified"),
    jobType: text(details.schedule_type, extensions.find((item) => /full.time|part.time|contract|intern/i.test(item)) ?? "Not specified"),
    remote,
    source: text(job.via, "Google Jobs"),
    url: text(job.apply_options?.find((option) => option.link)?.link, text(job.share_link, "")),
    postedDate: text(details.posted_at, "Posted recently"),
  };
}

async function fetchJobs(apiKey: string, keywords: string, location: string, pageToken?: string) {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_jobs");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("q", keywords);
  url.searchParams.set("location", location);
  url.searchParams.set("gl", "ph");
  url.searchParams.set("hl", "en");
  if (pageToken) url.searchParams.set("next_page_token", pageToken);

  const response = await fetch(url, { signal: AbortSignal.timeout(20_000), cache: "no-store" });
  if (!response.ok) throw new SerpApiError("http", response.status);

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new SerpApiError("invalid-json");
  }

  if (!payload || typeof payload !== "object") throw new SerpApiError("invalid-response");
  const result = payload as {
    jobs_results?: unknown;
    serpapi_pagination?: { next_page_token?: string };
    error?: string;
  };
  if (result.error) throw new SerpApiError("http", response.status, result.error);
  if (!Array.isArray(result.jobs_results)) throw new SerpApiError("invalid-response");
  return {
    jobs: result.jobs_results as SerpApiJob[],
    nextPageToken: result.serpapi_pagination?.next_page_token ?? null,
  };
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "job-search", 30, 60_000);
  if (limited) return limited;
  const apiKey = process.env.SERPAPI_API_KEY?.trim();
  if (Number(request.headers.get("content-length") || 0) > 16_384) {
    return NextResponse.json({ code: "INVALID_SEARCH_REQUEST" }, { status: 413 });
  }
  let body: SearchBody;
  try {
    body = await request.json() as SearchBody;
  } catch {
    return NextResponse.json({ code: "INVALID_SEARCH_REQUEST" }, { status: 400 });
  }

  const keywords = text(body.keywords, "");
  const requestedLocation = text(body.location, "Philippines");
  const pageToken = typeof body.pageToken === "string" ? body.pageToken.trim() : "";
  if (!keywords) return NextResponse.json({ code: "MISSING_KEYWORD" }, { status: 400 });
  if (keywords.length > 120 || requestedLocation.length > 120 || pageToken.length > 4096) {
    return NextResponse.json({ code: "INVALID_SEARCH_REQUEST" }, { status: 400 });
  }

  if (!apiKey || apiKey === "YOUR_API_KEY") {
    console.error("Google Jobs search is not configured: SERPAPI_API_KEY is missing.");
    return NextResponse.json({ code: "JOB_SEARCH_NOT_CONFIGURED" }, { status: 503 });
  }

  const normalizedLocation = normalizeLocation(requestedLocation);
  const searchKeywords = normalizedLocation.remoteSearch ? `remote ${keywords}` : keywords;

  try {
    const result = await fetchJobs(apiKey, searchKeywords, normalizedLocation.location, pageToken);
    return NextResponse.json({
      jobs: result.jobs.map(normalizeJob),
      keyword: keywords,
      location: normalizedLocation.location,
      pageToken: pageToken || null,
      nextPageToken: result.nextPageToken,
      limit: 10,
      total: result.jobs.length,
      locationBroadened: false,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Google Jobs search failed:", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: apiKey
        ? errorMessage.replaceAll(encodeURIComponent(apiKey), "[redacted]").replaceAll(apiKey, "[redacted]")
        : errorMessage,
    });

    if (error instanceof SerpApiError && error.kind === "http") {
      const code = error.status === 401 ? "JOB_SEARCH_PROVIDER_401" : error.status === 403 ? "JOB_SEARCH_PROVIDER_403" : "JOB_SEARCH_PROVIDER_ERROR";
      return NextResponse.json({ code }, { status: 502 });
    }
    if (error instanceof SerpApiError) {
      return NextResponse.json({ code: error.kind === "invalid-json" ? "JOB_SEARCH_INVALID_JSON" : "JOB_SEARCH_INVALID_RESPONSE" }, { status: 502 });
    }

    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json({ code: timedOut ? "JOB_SEARCH_TIMEOUT" : "JOB_SEARCH_NETWORK_ERROR" }, { status: timedOut ? 504 : 503 });
  }
}
