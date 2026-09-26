import { NextResponse } from "next/server";

const backendUrl = process.env.BACKEND_API_URL?.trim() || "http://127.0.0.1:8000";

export async function proxyApplicationRequest(request: Request, path = "") {
  const headers: Record<string, string> = {};
  const cookie = request.headers.get("cookie");
  if (cookie) headers.Cookie = cookie;

  const body = request.method === "GET" ? undefined : await request.text();
  if (body) headers["Content-Type"] = request.headers.get("content-type") || "application/json";

  try {
    const backendResponse = await fetch(`${backendUrl}/api/applications${path}`, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const payload: unknown = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      const code = backendResponse.status === 401
        ? "AUTH_REQUIRED"
        : backendResponse.status === 404
          ? "APPLICATION_NOT_FOUND"
          : backendResponse.status >= 500
            ? "APPLICATIONS_UNAVAILABLE"
            : "INVALID_APPLICATION";
      return NextResponse.json({ code }, { status: backendResponse.status });
    }

    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    console.error("Applications API proxy failed:", error);
    return NextResponse.json({ code: "APPLICATIONS_UNAVAILABLE" }, { status: 503 });
  }
}