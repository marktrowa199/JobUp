import { NextResponse } from "next/server";

export const runtime = "nodejs";

type JoobleJob = {
  title?: unknown;
  location?: unknown;
  snippet?: unknown;
  salary?: unknown;
  source?: unknown;
  type?: unknown;
  link?: unknown;
  updated?: unknown;
  company?: unknown;
};

type SearchBody = {
  keywords?: unknown;
  location?: unknown;
  jobType?: unknown;
  remote?: unknown;
};

class JoobleApiError extends Error {
  constructor(
    readonly kind: "http" | "invalid-json" | "invalid-response",
    readonly status?: number,
  ) {
    super(kind === "http" ? `Jooble returned HTTP ${status}` : `Jooble returned ${kind}`);
  }
}

const PHILIPPINE_LOCATIONS = [
  "Angeles City",
  "Quezon City",
  "Metro Manila",
  "Makati",
  "Pasig",
  "Taguig",
  "Pampanga",
  "Manila",
  "Cebu",
  "Davao",
  "Philippines",
];

function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function stableId(job: JoobleJob, index: number): string {
  const link = text(job.link, "");
  if (link) {
    return link;
  }

  return `${text(job.title, "job")}-${text(job.company, "company")}-${index}`;
}

function normalizeJob(job: JoobleJob, index: number) {
  return {
    id: stableId(job, index),
    title: text(job.title, "Not specified"),
    company: text(job.company, "Not specified"),
    location: text(job.location, "Not specified"),
    salary: text(job.salary, "Salary not specified"),
    description: text(job.snippet, "No description available."),
    jobType: text(job.type, "Not specified"),
    url: text(job.link, ""),
    source: text(job.source, "Jooble"),
    postedDate: text(job.updated, "Posted recently"),
  };
}

function jobKey(job: JoobleJob): string {
  const link = text(job.link, "").toLowerCase();
  if (link) {
    return `link:${link}`;
  }

  return [job.title, job.company, job.location]
    .map((value) => text(value, "").toLowerCase().replace(/\s+/g, " "))
    .join("|");
}

function detectLocation(value: string): { keywords: string; location: string } {
  const normalized = value.trim().replace(/\s+/g, " ");
  const detected = PHILIPPINE_LOCATIONS.find((candidate) =>
    new RegExp(`(?:^|\\s|,)${candidate.replace(" ", "\\s+")}(?:$|\\s|,)`, "i").test(normalized),
  );

  if (!detected || detected === "Philippines") {
    return { keywords: normalized, location: "Philippines" };
  }

  const keywords = normalized
    .replace(new RegExp(`\\s*(?:in|at|near)\\s+${detected}\\s*$`, "i"), "")
    .replace(new RegExp(`\\s+${detected}\\s*$`, "i"), "")
    .trim();

  return { keywords: keywords || normalized, location: `${detected}, Philippines` };
}

async function fetchJoobleJobs(
  apiKey: string,
  keywords: string,
  location: string,
  jobType: string,
  remote: string,
): Promise<JoobleJob[]> {
  const response = await fetch(`https://jooble.org/api/${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      keywords,
      location,
      page: 1,
      ...(jobType && jobType !== "Any" ? { type: jobType } : {}),
      ...(remote && remote !== "Any" ? { remote } : {}),
    }),
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new JoobleApiError("http", response.status);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new JoobleApiError("invalid-json");
  }

  const jobs =
    payload && typeof payload === "object" && Array.isArray((payload as { jobs?: unknown }).jobs)
      ? (payload as { jobs: JoobleJob[] }).jobs
      : null;

  if (!jobs) {
    throw new JoobleApiError("invalid-response");
  }

  return jobs;
}

export async function POST(request: Request) {
  const apiKey = process.env.JOOBLE_API_KEY?.trim();

  let body: SearchBody;
  try {
    body = (await request.json()) as SearchBody;
  } catch {
    return NextResponse.json({ code: "INVALID_SEARCH_REQUEST" }, { status: 400 });
  }

  const requestedKeywords = text(body.keywords, "");
  const requestedLocation = text(body.location, "");
  const jobType = text(body.jobType, "");
  const remote = text(body.remote, "");

  if (!requestedKeywords) {
    return NextResponse.json({ code: "MISSING_KEYWORD" }, { status: 400 });
  }

  if (!apiKey || apiKey === "YOUR_API_KEY") {
    console.error("JOOBLE API ERROR:", "Server-side search credentials are missing or invalid.");
    return NextResponse.json(
      { code: "JOB_SEARCH_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const detected = requestedLocation
    ? { keywords: requestedKeywords, location: requestedLocation }
    : detectLocation(requestedKeywords);
  const searchLocation = requestedLocation
    ? requestedLocation
    : detected.location.toLowerCase().includes("philippines")
      ? detected.location
      : `${detected.location}, Philippines`;

  try {
    let jobs = await fetchJoobleJobs(apiKey, detected.keywords, searchLocation, jobType, remote);
    let locationBroadened = false;

    if (jobs.length === 0 && searchLocation.toLowerCase() !== "philippines") {
      jobs = await fetchJoobleJobs(apiKey, detected.keywords, "Philippines", jobType, remote);
      locationBroadened = jobs.length > 0;
    }

    const uniqueJobs = jobs.filter((job, index, allJobs) => {
      const key = jobKey(job);
      return key !== "||" && allJobs.findIndex((candidate) => jobKey(candidate) === key) === index;
    });

    return NextResponse.json({
      jobs: uniqueJobs.slice(0, 20).map(normalizeJob),
      keyword: detected.keywords,
      location: locationBroadened ? "Philippines" : searchLocation,
      locationBroadened,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const safeErrorMessage = apiKey
      ? errorMessage
          .replaceAll(encodeURIComponent(apiKey), "[redacted]")
          .replaceAll(apiKey, "[redacted]")
      : errorMessage;
    console.error("JOOBLE API ERROR:", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: safeErrorMessage,
    });

    if (error instanceof JoobleApiError) {
      if (error.kind === "http") {
        const status = error.status === 429 ? 429 : 502;
        return NextResponse.json(
          { code: `JOB_SEARCH_PROVIDER_${error.status ?? "ERROR"}` },
          { status },
        );
      }

      return NextResponse.json(
        { code: error.kind === "invalid-json" ? "JOB_SEARCH_INVALID_JSON" : "JOB_SEARCH_INVALID_RESPONSE" },
        { status: 502 },
      );
    }

    const timedOut = error instanceof Error
      && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json(
      {
        code: timedOut ? "JOB_SEARCH_TIMEOUT" : "JOB_SEARCH_NETWORK_ERROR",
      },
      { status: timedOut ? 504 : 503 },
    );
  }
}