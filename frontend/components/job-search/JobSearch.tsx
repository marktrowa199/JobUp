"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  defaultFilters,
  locationOptions,
  recentSearches,
  normalizeJobFromApi,
  type Job,
  type JobSearchFilters,
} from "@/lib/jobSearch";
import { LocationDropdown } from "@/components/job-search/LocationDropdown";
import { SearchFilters } from "@/components/job-search/SearchFilters";
import { RecommendedJobs } from "@/components/jobs/RecommendedJobs";
import { RecentSearches } from "@/components/jobs/RecentSearches";
import { ResumeDiscovery } from "@/components/jobs/ResumeDiscovery";
import { searchJobsApi } from "@/services/jobApi";
import { useNotifications } from "@/components/notifications/NotificationProvider";

type JobSearchProps = {
  onSearch?: (jobs: Job[]) => void;
};

const RECENT_SEARCHES_KEY = "jobup-recent-searches";

export function JobSearch({ onSearch }: JobSearchProps) {
  const [jobQuery, setJobQuery] = useState("Python Developer");
  const [location, setLocation] = useState("");
  const [filters, setFilters] = useState<JobSearchFilters>(defaultFilters);
  const [savedSearches, setSavedSearches] = useState(recentSearches);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [results, setResults] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { notify } = useNotifications();
  const locationRef = useRef<HTMLDivElement | null>(null);
  const recentSearchesLoaded = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const loadSavedSearches = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(RECENT_SEARCHES_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setSavedSearches(parsed);
          }
        }
      } catch {
        // Ignore malformed local browser data and keep the default searches.
      } finally {
        recentSearchesLoaded.current = true;
      }
    }, 0);

    return () => window.clearTimeout(loadSavedSearches);
  }, []);

  useEffect(() => {
    if (!recentSearchesLoaded.current) {
      return;
    }
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(savedSearches));
  }, [savedSearches]);

  const filteredLocationOptions = useMemo(() => {
    const value = location.trim().toLowerCase();
    if (!value) {
      return locationOptions;
    }

    return locationOptions.filter((option) => option.toLowerCase().includes(value));
  }, [location]);

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    notify("info", "Searching for jobs...");

    try {
      const response = await searchJobsApi({
        keyword: jobQuery,
        location,
        jobType: filters.jobType,
        remote: filters.remote,
      });

      const nextResults = response.jobs.map((job) => normalizeJobFromApi(job));
      setResults(nextResults);
      setLocation(response.location);
      if (onSearch) {
        onSearch(nextResults);
      }
      setSavedSearches((current) => [
        { job: jobQuery, location: response.location, type: filters.jobType },
        ...current.filter((item) => item.job !== jobQuery || item.location !== response.location),
      ].slice(0, 5));
      if (response.locationBroadened) {
        setError(`No jobs were found in the requested city, so we broadened this search to the Philippines. Showing ${nextResults.length} result${nextResults.length === 1 ? "" : "s"}.`);
      } else if (nextResults.length === 0) {
        setError("No jobs found in the Philippines. Try another job title, keyword, or location.");
      }
      notify("success", `${nextResults.length} job${nextResults.length === 1 ? "" : "s"} found.`);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "We couldn't load job listings right now.");
      notify("error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const searchTimer = window.setTimeout(() => {
      void handleSearch();
    }, 0);

    return () => window.clearTimeout(searchTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQuickSearch = async (recent: { job: string; location: string; type: string }) => {
    setJobQuery(recent.job);
    setLocation(recent.location);
    setFilters((current) => ({ ...current, jobType: recent.type }));

    setLoading(true);
    setError("");
    notify("info", "Searching for jobs...");

    try {
      const response = await searchJobsApi({
        keyword: recent.job,
        location: recent.location,
        jobType: recent.type,
      });
      setResults(response.jobs.map((job) => normalizeJobFromApi(job)));
      setLocation(response.location);
      if (response.locationBroadened) {
        setError(`No jobs were found in ${recent.location}, so we broadened this search to the Philippines.`);
      } else if (response.jobs.length === 0) {
        setError(`No jobs found for "${recent.job}" in "${recent.location}".`);
      }
      notify("success", `${response.jobs.length} job${response.jobs.length === 1 ? "" : "s"} found.`);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "We couldn't load job listings right now.");
      notify("error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ResumeDiscovery />
      <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Job Search</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
            Find Your Next Opportunity
          </h1>
          <p className="mt-2 max-w-2xl text-base text-slate-600">
            Discover jobs that match your skills, experience, and career goals.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.5fr_1.2fr_auto]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input
              aria-label="Job search"
              type="text"
              value={jobQuery}
              onChange={(event) => setJobQuery(event.target.value)}
              placeholder="Search job title, skills, or keywords"
              className="w-full border-0 bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div ref={locationRef} className="relative">
            <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="mr-2 text-slate-400">📍</span>
              <input
                aria-label="Location"
                type="text"
                value={location}
                onChange={(event) => {
                  setLocation(event.target.value);
                  setIsLocationOpen(true);
                }}
                onFocus={() => setIsLocationOpen(true)}
                placeholder="Enter suburb, city, or region"
                className="w-full border-0 bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <LocationDropdown
              isOpen={isLocationOpen}
              options={filteredLocationOptions}
              onSelect={(option) => {
                setLocation(option);
                setIsLocationOpen(false);
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => void handleSearch()}
            disabled={loading}
            className="rounded-2xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {loading ? "Searching..." : "Search Jobs"}
          </button>
        </div>

        <SearchFilters
          values={filters}
          onChange={(name, value) => setFilters((current) => ({ ...current, [name]: value }))}
        />

        {error && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {error}
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1.6fr_0.9fr]">
        <div>
          <RecommendedJobs jobs={results} />
        </div>
        <div>
          <RecentSearches
            items={savedSearches}
            onSelect={(item: { job: string; location: string; type: string }) => {
              void handleQuickSearch(item);
            }}
          />
        </div>
      </div>
    </section>
  );
}
