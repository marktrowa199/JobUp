"use client";

import { useRef, useState } from "react";
import { normalizeJobFromApi, type Job } from "@/lib/jobSearch";
import { searchJobsApi } from "@/services/jobApi";
import { ApplicationLink } from "@/components/jobs/ApplicationLink";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import { UserFacingError, userFacingErrorMessage } from "@/lib/userFacingErrors";

type SearchQuery = { keyword: string; location: string };

export function JobSearchPanel() {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("Philippines");
  const [jobType, setJobType] = useState("Any");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [activeQuery, setActiveQuery] = useState<SearchQuery | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const keywordInputRef = useRef<HTMLInputElement>(null);
  const pageTokensRef = useRef<Array<string | null>>([null]);
  const { notify } = useNotifications();

  const searchPage = async (requestedPage: number, query: SearchQuery) => {
    setLoading(true);
    setSearched(true);
    setError("");
    try {
      const response = await searchJobsApi({
        keyword: query.keyword,
        location: query.location,
        page: requestedPage,
        pageToken: pageTokensRef.current[requestedPage - 1] ?? null,
      });
      pageTokensRef.current = pageTokensRef.current.slice(0, requestedPage);
      pageTokensRef.current[requestedPage] = response.nextPageToken;
      setHasNextPage(Boolean(response.nextPageToken));
      setJobs(response.jobs.map(normalizeJobFromApi));
      setTotal(response.total);
      setPage(response.page);
      if (requestedPage === 1 && response.jobs.length > 0) notify("success", `${response.jobs.length} jobs found.`);
    } catch (searchError) {
      const message = searchError instanceof UserFacingError
        ? searchError.message
        : userFacingErrorMessage("JOB_SEARCH_NETWORK_ERROR");
      setJobs([]);
      setTotal(0);
      setError(message);
      notify("warning", message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = { keyword: keyword.trim(), location: location.trim() || "Philippines" };
    pageTokensRef.current = [null];
    setHasNextPage(false);
    setActiveQuery(query);
    void searchPage(1, query);
  };

  const visibleJobs = jobType === "Any"
    ? jobs
    : jobs.filter((job) => job.type.toLowerCase().replaceAll("-", " ").includes(jobType.toLowerCase().replaceAll("-", " ")));

  return (
    <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="job-search-title">
      <div className="mb-5">
        <h2 id="job-search-title" className="text-xl font-semibold text-slate-900">What job are you looking for?</h2>
        <p className="mt-1 text-sm text-slate-600">Search current job listings across the Philippines.</p>
      </div>
      <form onSubmit={handleSearch} className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1.5fr)_minmax(11rem,1fr)_minmax(9rem,.7fr)_auto]">
        <label className="text-sm font-medium text-slate-700">Job title or keyword
          <input ref={keywordInputRef} required value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="e.g. Software Developer" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </label>
        <label className="text-sm font-medium text-slate-700">Where?
          <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Philippines" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </label>
        <label className="text-sm font-medium text-slate-700">Job type
          <select value={jobType} onChange={(event) => setJobType(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal">
            <option>Any</option><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
          </select>
        </label>
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60 sm:col-span-2 lg:col-span-1">{loading ? "Searching..." : "Search jobs"}</button>
      </form>

      {loading && (
        <div className="mt-6 space-y-3" role="status" aria-label="Searching for jobs">
          <p className="text-sm text-slate-600">Searching for jobs...</p>
          {[0, 1].map((item) => <div key={item} className="animate-pulse rounded-lg border border-slate-200 p-4"><div className="h-4 w-1/3 rounded bg-slate-200" /><div className="mt-3 h-3 w-1/2 rounded bg-slate-100" /></div>)}
        </div>
      )}
      {!loading && error && <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="alert">{error}</p>}
      {!loading && !error && searched && total === 0 && (
        <div className="mt-6 border-t border-slate-200 pt-5">
          <h3 className="font-semibold text-slate-900">No jobs found</h3>
          <p className="mt-1 text-sm text-slate-600">We couldn&apos;t find jobs matching your search. Try a broader job title or another location.</p>
          <button type="button" onClick={() => keywordInputRef.current?.focus()} className="mt-3 text-sm font-semibold text-indigo-700 hover:text-indigo-800">Search again</button>
        </div>
      )}
      {!loading && !error && jobs.length > 0 && (
        <div className="mt-6 border-t border-slate-200 pt-5">
          <div className="mb-3 flex items-center justify-between gap-3 text-sm text-slate-600">
            <p>{jobType === "Any" ? `Showing ${jobs.length} jobs on this page` : `${visibleJobs.length} ${jobType} jobs on this page`}</p>
            <p className="hidden sm:block">{activeQuery?.keyword} · {activeQuery?.location}</p>
          </div>
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {visibleJobs.map((job) => (
              <article key={job.id} className="py-5 first:pt-4 last:pb-4">
                <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
                <p className="mt-1 text-sm text-slate-700">{job.company}</p>
                <p className="mt-0.5 text-sm text-slate-600">{job.location}</p>
                <p className="mt-2 text-sm text-slate-700">{job.pay}</p>
                <p className="mt-1 text-sm text-slate-600">{[job.type, job.remote === "Not specified" ? "" : job.remote].filter(Boolean).join(" · ")}</p>
                <p className="mt-1 text-xs text-slate-500">{job.listingTime}</p>
                <div className="mt-3"><ApplicationLink job={job} className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700" /></div>
              </article>
            ))}
            {visibleJobs.length === 0 && <p className="py-5 text-sm text-slate-600">No {jobType.toLowerCase()} jobs on this page. Try another page or choose Any job type.</p>}
          </div>
          {(page > 1 || hasNextPage) && (
            <div className="mt-4 flex items-center justify-between">
              <button type="button" onClick={() => activeQuery && void searchPage(page - 1, activeQuery)} disabled={loading || page <= 1} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Previous</button>
              <span className="text-sm text-slate-600">Page {page}</span>
              <button type="button" onClick={() => activeQuery && void searchPage(page + 1, activeQuery)} disabled={loading || !hasNextPage} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Next</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
