"use client";

import { useState } from "react";
import { analyzeJob, type JobAnalysisResult } from "@/lib/jobAnalysis";

const initialForm = {
  title: "",
  company: "",
  description: "",
};

export default function AnalyzeJobPage() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState<JobAnalysisResult | null>(null);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.title.trim()) {
      nextErrors.title = "Job title is required.";
    }
    if (!form.company.trim()) {
      nextErrors.company = "Company is required.";
    }
    if (!form.description.trim()) {
      nextErrors.description = "Job description is required.";
    } else if (form.description.trim().length < 30) {
      nextErrors.description = "Job description should be at least 30 characters long.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const data = await analyzeJob({
        title: form.title.trim(),
        company: form.company.trim(),
        description: form.description.trim(),
      });
      setResult(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      setSubmitError(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8">
          <a
            href="/workspace"
            className="inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-400/20"
          >
            ← Back to JobUp
          </a>
        </div>

        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Analyze Job</p>
          <h1 className="mt-3 text-4xl font-bold">Review a job description in seconds</h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-cyan-950/20"
          >
            <div className="space-y-5">
              <div>
                <label htmlFor="title" className="mb-2 block text-sm font-medium text-slate-200">
                  Job Title
                </label>
                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Junior Python Developer"
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                />
                {errors.title && <p className="mt-2 text-sm text-red-400">{errors.title}</p>}
              </div>

              <div>
                <label htmlFor="company" className="mb-2 block text-sm font-medium text-slate-200">
                  Company
                </label>
                <input
                  id="company"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Example Technologies"
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                />
                {errors.company && <p className="mt-2 text-sm text-red-400">{errors.company}</p>}
              </div>

              <div>
                <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-200">
                  Job Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Paste the job description here..."
                  disabled={loading}
                  rows={8}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                />
                {errors.description && (
                  <p className="mt-2 text-sm text-red-400">{errors.description}</p>
                )}
              </div>

              {submitError && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-cyan-500/60"
              >
                {loading ? "Analyzing..." : "Analyze Job"}
              </button>
            </div>
          </form>

          <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-cyan-950/20">
            <h2 className="text-xl font-semibold">Analysis Result</h2>

            {!result && !submitError && (
              <p className="mt-4 text-sm text-slate-400">
                Submit a job description to see the detected skills.
              </p>
            )}

            {result && (
              <div className="mt-5 space-y-4 text-sm text-slate-300">
                <div>
                  <p className="text-slate-400">Job Title</p>
                  <p className="mt-1 text-lg font-semibold text-white">{result.title}</p>
                </div>

                <div>
                  <p className="text-slate-400">Company</p>
                  <p className="mt-1 text-lg font-semibold text-white">{result.company}</p>
                </div>

                <div>
                  <p className="text-slate-400">Status</p>
                  <p className="mt-1 capitalize text-cyan-300">{result.status}</p>
                </div>

                <div>
                  <p className="text-slate-400">Detected Skills</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result.detected_skills.length > 0 ? (
                      result.detected_skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-200"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-amber-300">No recognized technical skills were detected.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-emerald-200">
                  {result.message}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
