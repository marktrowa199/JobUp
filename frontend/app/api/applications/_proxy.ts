import { NextResponse } from "next/server";
import { clientAddress, rateLimit, sameOriginRequired } from "@/lib/apiSecurity";

const backendUrl = process.env.BACKEND_API_URL?.trim() || "http://127.0.0.1:8000";
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME?.trim() || "jobup_session";

export async function proxyApplicationRequest(request: Request, path = "") {
  if (request.method !== "GET") {
    const originFailure = sameOriginRequired(request);
    if (originFailure) return originFailure;
    const limited = rateLimit(request, "application-write", 30, 60_000);
    if (limited) return limited;
  }
  const headers: Record<string, string> = {};
  const cookie = request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (cookie) headers.Cookie = cookie;
  headers["X-JobUp-Client-IP"] = clientAddress(request);

  if (Number(request.headers.get("content-length") || 0) > 16_384) {
    return NextResponse.json({ code: "INVALID_APPLICATION" }, { status: 413 });
  }
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

    return NextResponse.json(payload, { status: backendResponse.status, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Applications API proxy failed.", { name: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ code: "APPLICATIONS_UNAVAILABLE" }, { status: 503 });
  }
}
