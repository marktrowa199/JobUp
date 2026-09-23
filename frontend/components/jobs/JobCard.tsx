import type { Job } from "@/lib/jobSearch";

type JobCardProps = {
  job: Job;
};

export function JobCard({ job }: JobCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">{job.title}</h3>
          <p className="mt-1 text-base font-medium text-slate-600">{job.company}</p>
        </div>
        {job.match !== null ? (
          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            {job.match}% Match
          </span>
        ) : (
          <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
            Recommended
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <span>📍 {job.location}</span>
        <span className="text-slate-300">•</span>
        <span>{job.type}</span>
        <span className="text-slate-300">•</span>
        <span>{job.listingTime}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{job.remote}</span>
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">{job.classification}</span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{job.description}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {job.skills.length > 0 ? (
          job.skills.map((skill) => (
            <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
              {skill}
            </span>
          ))
        ) : (
          <span className="text-xs text-slate-500">Source: {job.source}</span>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Source</p>
          <p className="text-sm font-semibold text-slate-900">{job.source}</p>
        </div>
        {job.url ? (
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            View Job
          </a>
        ) : (
          <span className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500">
            Link unavailable
          </span>
        )}
      </div>
    </article>
  );
}
