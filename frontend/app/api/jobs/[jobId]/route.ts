import { NextResponse } from "next/server";

const backendUrl = process.env.BACKEND_API_URL?.trim() || "http://127.0.0.1:8000";

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await context.params;
  if (!jobId || jobId.length > 512) {
    return NextResponse.json({ detail: "Job not found." }, { status: 404 });
  }

  try {
    const response = await fetch(`${backendUrl}/api/jobs/${encodeURIComponent(jobId)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const payload = await response.json().catch(() => ({ detail: "Unable to load this job." }));
    return NextResponse.json(payload, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Job detail proxy failed.", { name: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ detail: "Unable to load this job right now." }, { status: 503 });
  }
}
