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
    throw new Error(`Jooble request failed with status ${response.status}`);
  }

  const payload: unknown = await response.json();
  const jobs =
    payload && typeof payload === "object" && Array.isArray((payload as { jobs?: unknown }).jobs)
      ? (payload as { jobs: JoobleJob[] }).jobs
      : null;

  if (!jobs) {
    throw new Error("Unexpected Jooble response shape");
  }

  return jobs;
}

export async function POST(request: Request) {
  const apiKey = process.env.JOOBLE_API_KEY?.trim();

  let body: SearchBody;
  try {
    body = (await request.json()) as SearchBody;
  } catch {
    return NextResponse.json({ message: "Invalid search request." }, { status: 400 });
  }

  const requestedKeywords = text(body.keywords, "");
  const requestedLocation = text(body.location, "");
  const jobType = text(body.jobType, "");
  const remote = text(body.remote, "");

  if (!requestedKeywords) {
    return NextResponse.json({ message: "Enter a job keyword to search." }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json(
      { message: "The Jooble job search provider is not configured. Add JOOBLE_API_KEY to frontend/.env.local." },
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
    console.error("Jooble request error", error);
    if (error instanceof Error && error.message.includes("status 429")) {
      return NextResponse.json(
        { message: "The job search provider rate limit was reached. Please try again shortly." },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { message: "We couldn't connect to the job search provider." },
      { status: 502 },
    );
  }
}