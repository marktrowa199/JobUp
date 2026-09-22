"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [health, setHealth] = useState<{ status?: string; service?: string }>({});

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/health")
      .then((response) => response.json())
      .then((data) => setHealth(data))
      .catch(() => setHealth({ status: "offline" }));
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">JobUp</p>
            <h1 className="mt-2 text-4xl font-bold">AI-powered job application assistant</h1>
          </div>
          <div className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
            {health.status === "ok" ? "Backend online" : "Awaiting backend"}
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-4">
          {[
            { label: "Applications", value: "12" },
            { label: "Average Match", value: "82%" },
            { label: "Interviews", value: "3" },
            { label: "Skills to Improve", value: "5" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-cyan-950/20">
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className="mt-4 text-3xl font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Core MVP workflow</h2>
            <ol className="mt-6 space-y-4 text-slate-300">
              <li>1. Register and log in</li>
              <li>2. Upload resume and parse PDF content</li>
              <li>3. Save a job description</li>
              <li>4. Analyze resume vs. job</li>
              <li>5. Review match score, skill gaps, and recommendations</li>
            </ol>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">System status</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>
                API: <span className={health.status === "ok" ? "text-emerald-400" : "text-amber-300"}>{health.status ?? "loading..."}</span>
              </p>
              <p>Service: {health.service ?? "jobup-api"}</p>
              <p>Frontend: Next.js + TypeScript + Tailwind</p>
              <p>Backend: FastAPI + Python</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
