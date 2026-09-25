import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { analyzeResumeText, InvalidResumeError } from "@/lib/resumeDiscovery";

export const runtime = "nodejs";

const MAX_RESUME_BYTES = 8 * 1024 * 1024;
const BACKEND_API_URL = process.env.BACKEND_API_URL?.trim() || "http://127.0.0.1:8000";

export async function POST(request: Request) {
  const cookie = request.headers.get("cookie");
  if (!cookie) {
    return NextResponse.json({ message: "Log in to analyze your resume." }, { status: 401 });
  }

  try {
    const sessionResponse = await fetch(`${BACKEND_API_URL}/api/auth/me`, {
      headers: { Cookie: cookie },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!sessionResponse.ok) {
      return NextResponse.json({ message: "Log in to analyze your resume." }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ message: "JobUp is temporarily unavailable. Please try again." }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ message: "Choose a PDF or TXT resume to upload." }, { status: 400 });
  }

  const file = form.get("resume");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Choose a PDF or TXT resume to upload." }, { status: 400 });
  }
  if (file.size > MAX_RESUME_BYTES) {
    return NextResponse.json({ code: "FILE_TOO_LARGE", message: "Resume files must be 8 MB or smaller." }, { status: 413 });
  }

  const extension = file.name.toLowerCase().split(".").pop();
  if (extension !== "pdf" && extension !== "docx" && extension !== "txt") {
    return NextResponse.json({ code: "UNSUPPORTED_FILE_TYPE", message: "Upload a PDF, DOCX, or TXT resume. Legacy DOC files are not supported." }, { status: 415 });
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    let resumeText: string;
    if (extension === "pdf") {
      if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
        throw new InvalidResumeError("This file doesn't contain a readable PDF document.");
      }
      resumeText = (await pdfParse(bytes)).text;
    } else if (extension === "docx") {
      if (bytes.subarray(0, 2).toString("ascii") !== "PK") {
        throw new InvalidResumeError("This file doesn't contain a readable DOCX document.");
      }
      resumeText = (await mammoth.extractRawText({ buffer: bytes })).value;
    } else {
      if (bytes.includes(0)) throw new InvalidResumeError("This file doesn't contain readable resume text.");
      resumeText = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    }
    const profile = analyzeResumeText(resumeText, file.name);
    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof InvalidResumeError) {
      return NextResponse.json({
        code: "INVALID_RESUME",
        message: "We couldn't detect a valid resume in this file. Please upload a resume or CV to use Resume-Powered Discovery.",
      }, { status: 422 });
    }
    return NextResponse.json(
      {
        code: "INVALID_RESUME",
        message: "We couldn't detect a valid resume in this file. Please upload a resume or CV to use Resume-Powered Discovery.",
      },
      { status: 422 },
    );
  }
}