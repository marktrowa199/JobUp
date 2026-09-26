import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { analyzeResumeText, InvalidResumeError } from "@/lib/resumeDiscovery";
import { clientAddress, rateLimit, sameOriginRequired } from "@/lib/apiSecurity";

export const runtime = "nodejs";

const MAX_RESUME_BYTES = 8 * 1024 * 1024;
const BACKEND_API_URL = process.env.BACKEND_API_URL?.trim() || "http://127.0.0.1:8000";
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME?.trim() || "jobup_session";

function privateJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

function safeErrorMessage(error: unknown, filename?: string) {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replaceAll(filename || "\u0000", "[filename]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[phone]")
    .replace(/[\r\n\t]/g, " ")
    .slice(0, 300);
}

export async function POST(request: Request) {
  const originFailure = sameOriginRequired(request);
  if (originFailure) return originFailure;
  const limited = rateLimit(request, "resume-analysis", 10, 15 * 60_000);
  if (limited) return limited;
  const cookie = request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (!cookie) {
    return privateJson({ code: "AUTH_REQUIRED" }, 401);
  }
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_RESUME_BYTES + 128 * 1024) {
    return privateJson({ code: "FILE_TOO_LARGE" }, 413);
  }

  try {
    const sessionResponse = await fetch(`${BACKEND_API_URL}/api/auth/me`, {
      headers: { Cookie: cookie, "X-JobUp-Client-IP": clientAddress(request) },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!sessionResponse.ok) {
      console.warn("Resume authentication check was rejected.", { status: sessionResponse.status });
      return privateJson({ code: "AUTH_REQUIRED" }, 401);
    }
  } catch (error) {
    console.error("Resume authentication check failed.", { name: error instanceof Error ? error.name : "UnknownError" });
    return privateJson({ code: "RESUME_ANALYSIS_UNAVAILABLE" }, 503);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch (error) {
    console.warn("Resume upload form could not be parsed.", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: safeErrorMessage(error),
    });
    return privateJson({ code: "INVALID_RESUME_REQUEST" }, 400);
  }

  const file = form.get("resume");
  if (!(file instanceof File)) {
    return privateJson({ code: "INVALID_RESUME_REQUEST" }, 400);
  }
  if (file.size > MAX_RESUME_BYTES) {
    return privateJson({ code: "FILE_TOO_LARGE" }, 413);
  }

  const extension = file.name.toLowerCase().split(".").pop();
  if (extension !== "pdf" && extension !== "docx" && extension !== "txt") {
    return privateJson({ code: "UNSUPPORTED_FILE_TYPE" }, 415);
  }

  let stage = "read-file";
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    let resumeText: string;
    if (extension === "pdf") {
      stage = "parse-pdf";
      if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
        throw new InvalidResumeError("This file doesn't contain a readable PDF document.");
      }
      try {
        resumeText = (await pdfParse(bytes)).text;
      } catch (error) {
        console.warn("PDF parser rejected the uploaded document.", {
          name: error instanceof Error ? error.name : "UnknownError",
          message: safeErrorMessage(error, file.name),
        });
        throw new InvalidResumeError("This PDF is damaged, encrypted, or unreadable.");
      }
    } else if (extension === "docx") {
      stage = "parse-docx";
      if (bytes.subarray(0, 2).toString("ascii") !== "PK") {
        throw new InvalidResumeError("This file doesn't contain a readable DOCX document.");
      }
      try {
        resumeText = (await mammoth.extractRawText({ buffer: bytes })).value;
      } catch (error) {
        console.warn("DOCX parser rejected the uploaded document.", {
          name: error instanceof Error ? error.name : "UnknownError",
          message: safeErrorMessage(error, file.name),
        });
        throw new InvalidResumeError("This DOCX file is damaged or unreadable.");
      }
    } else {
      stage = "decode-text";
      if (bytes.includes(0)) throw new InvalidResumeError("This file doesn't contain readable resume text.");
      try {
        resumeText = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      } catch (error) {
        console.warn("Text resume is not valid UTF-8.", {
          name: error instanceof Error ? error.name : "UnknownError",
        });
        throw new InvalidResumeError("This text file is not readable UTF-8.");
      }
    }
    const safeFilename = file.name.split(/[\\/]/).pop()?.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 255) || "resume";
    stage = "analyze-resume-text";
    const profile = analyzeResumeText(resumeText, safeFilename);
    return privateJson({ profile });
  } catch (error) {
    if (error instanceof InvalidResumeError) {
      console.warn("Resume validation failed.", { stage, message: safeErrorMessage(error, file.name) });
      return privateJson({ code: "INVALID_RESUME" }, 422);
    }
    console.error("Resume processing failed.", {
      stage,
      name: error instanceof Error ? error.name : "UnknownError",
      message: safeErrorMessage(error, file.name),
    });
    return privateJson({ code: "RESUME_ANALYSIS_UNAVAILABLE" }, 500);
  }
}
