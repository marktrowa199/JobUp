import { JobCard } from "@/components/jobs/JobCard";
import type { Job } from "@/lib/jobSearch";

type RecommendedJobsProps = {
  jobs: Job[];
};

export function RecommendedJobs({ jobs }: RecommendedJobsProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Recommended Jobs</h2>
        <span className="text-sm text-slate-500">{jobs.length} matches</span>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
          No jobs match the current search. Try another keyword or location.
        </div>
      ) : (
        <div className="grid gap-5">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
