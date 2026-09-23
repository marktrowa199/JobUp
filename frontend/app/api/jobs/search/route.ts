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
};

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

export async function POST(request: Request) {
  const apiKey = process.env.JOOBLE_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      { message: "The Jooble job search provider is not configured." },
      { status: 503 },
    );
  }

  let body: SearchBody;
  try {
    body = (await request.json()) as SearchBody;
  } catch {
    return NextResponse.json({ message: "Invalid search request." }, { status: 400 });
  }

  const keywords = text(body.keywords, "");
  const location = text(body.location, "");

  if (!keywords || !location) {
    return NextResponse.json(
      { message: "Enter a job keyword and location to search." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(`https://jooble.org/api/${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords, location, page: 1 }),
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Jooble request failed", response.status);
      return NextResponse.json(
        { message: "The job search provider is temporarily unavailable." },
        { status: response.status === 429 ? 429 : 502 },
      );
    }

    const payload: unknown = await response.json();
    const jobs =
      payload && typeof payload === "object" && Array.isArray((payload as { jobs?: unknown }).jobs)
        ? (payload as { jobs: JoobleJob[] }).jobs
        : null;

    if (!jobs) {
      console.error("Unexpected Jooble response shape");
      return NextResponse.json(
        { message: "The job search provider returned an unexpected response." },
        { status: 502 },
      );
    }

    return NextResponse.json({ jobs: jobs.slice(0, 20).map(normalizeJob) });
  } catch (error) {
    console.error("Jooble request error", error);
    return NextResponse.json(
      { message: "We couldn't connect to the job search provider." },
      { status: 502 },
    );
  }
}