import { NextResponse } from "next/server";
import { clientAddress, rateLimit, sameOriginRequired } from "@/lib/apiSecurity";

const backendUrl = process.env.BACKEND_API_URL?.trim() || "http://127.0.0.1:8000";
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME?.trim() || "jobup_session";

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
  if (request.method !== "GET") {
    const originFailure = sameOriginRequired(request);
    if (originFailure) return originFailure;
  }
  if (endpoint === "login") {
    const limited = rateLimit(request, "auth-login", 10, 15 * 60_000);
    if (limited) return limited;
  } else if (endpoint === "register") {
    const limited = rateLimit(request, "auth-register", 5, 60 * 60_000);
    if (limited) return limited;
  }
  try {
    if (Number(request.headers.get("content-length") || 0) > 16_384) {
      return NextResponse.json({ message: "Request is too large." }, { status: 413 });
    }
    const body = request.method === "GET" ? undefined : await request.text();
    if (body && new TextEncoder().encode(body).byteLength > 16_384) {
      return NextResponse.json({ message: "Request is too large." }, { status: 413 });
    }
    const headers: Record<string, string> = {};
    const cookie = request.headers.get("cookie")
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`));
    if (body) {
      headers["Content-Type"] = request.headers.get("content-type") || "application/json";
    }
    if (cookie) {
      headers.Cookie = cookie;
    }
    headers["X-JobUp-Client-IP"] = clientAddress(request);

    const backendResponse = await fetch(`${backendUrl}/api/auth/${endpoint}`, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const payload: unknown = await backendResponse.json().catch(() => ({}));
    if (!backendResponse.ok && endpoint === "logout") {
      console.error("Backend logout failed.", { status: backendResponse.status });
    }
    const responsePayload = backendResponse.ok
      ? payload
      : { message: messageFromPayload(payload) || "We couldn't complete that request. Please try again." };
    const response = NextResponse.json(responsePayload, { status: backendResponse.status });
    response.headers.set("Cache-Control", "no-store");

    if (forwardSetCookie) {
      const setCookie = backendResponse.headers.get("set-cookie");
      if (setCookie) {
        response.headers.set("set-cookie", setCookie);
      }
    }

    return response;
  } catch (error) {
    console.error(`Auth proxy request failed for ${endpoint}.`, { name: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json(
      { message: "JobUp is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
