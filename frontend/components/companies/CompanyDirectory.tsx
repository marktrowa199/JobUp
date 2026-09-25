"use client";

import { useState } from "react";
import { searchJobsApi, type JobApiItem } from "@/services/jobApi";

type CompanyListings = {
  name: string;
  jobs: JobApiItem[];
  locations: string[];
};

function groupCompanies(jobs: JobApiItem[], query: string): CompanyListings[] {
  const groups = new Map<string, CompanyListings>();
  const normalizedQuery = query.trim().toLowerCase();

  for (const job of jobs) {
    const name = job.company.trim();
    if (!name || name.toLowerCase() === "not specified") continue;
    if (normalizedQuery && !name.toLowerCase().includes(normalizedQuery)) continue;

    const key = name.toLowerCase();
    const company = groups.get(key) ?? { name, jobs: [], locations: [] };
    company.jobs.push(job);
    if (job.location && !company.locations.includes(job.location)) company.locations.push(job.location);
    groups.set(key, company);
  }

  return [...groups.values()].sort((first, second) => second.jobs.length - first.jobs.length || first.name.localeCompare(second.name));
}

export function CompanyDirectory() {
  const [query, setQuery] = useState("");
  const [companies, setCompanies] = useState<CompanyListings[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const searchCompanies = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const result = await searchJobsApi({
        keyword: query.trim() || "jobs",
        location: "Philippines",
      });
      const nextCompanies = groupCompanies(result.jobs, query);
      setCompanies(nextCompanies);
      if (nextCompanies.length === 0) {
        setError(query.trim()
          ? `No live Philippine job listings were found for companies matching "${query.trim()}".`
          : "The job provider returned no company listings. Please try again later.");
      }
    } catch (searchError) {
      setCompanies([]);
      setError(searchError instanceof Error ? searchError.message : "We couldn't load companies right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-labelledby="companies-title">
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Hiring in the Philippines</p>
        <h1 id="companies-title" className="mt-2 text-3xl font-bold text-slate-900">Companies</h1>
        <p className="mt-2 max-w-2xl text-slate-600">Browse employers from live job listings. Company descriptions and industries are shown only when the job source provides them.</p>
      </div>

      <form onSubmit={searchCompanies} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row">
        <label htmlFor="company-query" className="sr-only">Search company name</label>
        <input
          id="company-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a company, or browse all hiring companies"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
        />
        <button type="submit" disabled={loading} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-60">
          {loading ? "Searching live listings..." : query.trim() ? "Search companies" : "Browse companies"}
        </button>
      </form>

      {loading && <p className="py-10 text-center text-sm text-slate-600" role="status">Loading live company listings from the Philippines...</p>}
      {!loading && companies.length > 0 && (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {companies.map((company) => (
            <article key={company.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <h2 className="break-words text-lg font-semibold text-slate-900">{company.name}</h2>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  {company.jobs.length} {company.jobs.length === 1 ? "listing" : "listings"}
                </span>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div>
                  <dt className="inline font-medium text-slate-700">Location: </dt>
                  <dd className="inline text-slate-600">{company.locations.join(" · ") || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-slate-700">Industry: </dt>
                  <dd className="inline text-slate-600">Not provided by the job source</dd>
                </div>
              </dl>
              <div className="mt-5 border-t border-slate-100 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Available jobs</h3>
                <ul className="mt-3 space-y-3">
                  {company.jobs.slice(0, 4).map((job) => (
                    <li key={job.id} className="flex items-start justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="break-words font-medium text-slate-800">{job.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{job.location} · {job.salary || "Salary not specified"}</p>
                      </div>
                      {job.url && <a href={job.url} target="_blank" rel="noreferrer" className="shrink-0 font-semibold text-indigo-700 hover:text-indigo-900">View job</a>}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-4 text-xs text-slate-500">Company information is limited to fields included in live job listings.</p>
            </article>
          ))}
        </div>
      )}
      {!loading && companies.length === 0 && (
        <div className="mt-6 border-t border-slate-200 py-8 text-center" aria-live="polite">
          <h2 className="font-semibold text-slate-900">{searched ? "No companies to show" : "Browse employers hiring now"}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
            {error || "Company results are grouped from current Philippine job listings. Search by company name or browse the latest provider results."}
          </p>
        </div>
      )}
    </section>
  );
}
