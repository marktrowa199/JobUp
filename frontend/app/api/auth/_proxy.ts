import { NextResponse } from "next/server";

const backendUrl = process.env.BACKEND_API_URL?.trim() || "http://127.0.0.1:8000";

type BackendError = {
  detail?: unknown;
};

function messageFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const detail = (payload as BackendError).detail;
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    return "Please check the information you entered.";
  }
  return null;
}

export async function proxyAuthRequest(
  request: Request,
  endpoint: string,
  forwardSetCookie = false,
): Promise<NextResponse> {
  try {
    const body = request.method === "GET" ? undefined : await request.text();
    const headers: Record<string, string> = {};
    const cookie = request.headers.get("cookie");
    if (body) {
      headers["Content-Type"] = request.headers.get("content-type") || "application/json";
    }
    if (cookie) {
      headers.Cookie = cookie;
    }

    const backendResponse = await fetch(`${backendUrl}/api/auth/${endpoint}`, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const payload: unknown = await backendResponse.json().catch(() => ({}));
    const responsePayload = backendResponse.ok
      ? payload
      : { message: messageFromPayload(payload) || "We couldn't complete that request. Please try again." };
    const response = NextResponse.json(responsePayload, { status: backendResponse.status });

    if (forwardSetCookie) {
      const setCookie = backendResponse.headers.get("set-cookie");
      if (setCookie) {
        response.headers.set("set-cookie", setCookie);
      }
    }

    return response;
  } catch (error) {
    console.error(`Auth proxy request failed for ${endpoint}`, error);
    return NextResponse.json(
      { message: "JobUp is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
