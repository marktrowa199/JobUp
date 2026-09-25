"use client";

import { useState } from "react";
import {
  searchProfessionals,
  type ProfessionalProfile,
  type ProfessionalSearchQuery,
} from "@/services/peopleSearch";

const emptyQuery: ProfessionalSearchQuery = { nameOrTitle: "", skills: "", location: "" };

function ProfessionalCard({ person }: { person: ProfessionalProfile }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{person.name}</h2>
      <p className="mt-1 text-sm font-medium text-indigo-700">{person.title}</p>
      <p className="mt-3 text-sm text-slate-600">{person.location}{person.company ? ` · ${person.company}` : ""}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {person.skills.map((skill) => (
          <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{skill}</span>
        ))}
      </div>
    </article>
  );
}

export function PeopleSearch() {
  const [query, setQuery] = useState(emptyQuery);
  const [people, setPeople] = useState<ProfessionalProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setSearched(true);
    try {
      const result = await searchProfessionals(query);
      setPeople(result.people);
      if (!result.sourceConfigured) {
        setMessage("A professional directory is not connected yet. No people are shown until a verified data source is available.");
      } else if (result.people.length === 0) {
        setMessage("No professionals matched these filters. Try a broader search.");
      }
    } catch {
      setPeople([]);
      setMessage("People search is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-labelledby="people-search-title">
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Professional network</p>
        <h1 id="people-search-title" className="mt-2 text-3xl font-bold text-slate-900">People Search</h1>
        <p className="mt-2 max-w-2xl text-slate-600">Find professionals by role, skills, and location when a verified directory is connected.</p>
      </div>

      <form onSubmit={handleSearch} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_auto]">
        <label className="text-sm font-medium text-slate-700">
          Name or job title
          <input
            value={query.nameOrTitle}
            onChange={(event) => setQuery((current) => ({ ...current, nameOrTitle: event.target.value }))}
            placeholder="e.g. product designer"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Skills
          <input
            value={query.skills}
            onChange={(event) => setQuery((current) => ({ ...current, skills: event.target.value }))}
            placeholder="e.g. Figma, research"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Location
          <input
            value={query.location}
            onChange={(event) => setQuery((current) => ({ ...current, location: event.target.value }))}
            placeholder="e.g. Cebu"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500"
          />
        </label>
        <button type="submit" disabled={loading} className="self-end rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-60">
          {loading ? "Searching..." : "Search people"}
        </button>
      </form>

      {people.length > 0 ? (
        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {people.map((person) => <ProfessionalCard key={person.id} person={person} />)}
        </div>
      ) : (
        <div className="mt-6 border-t border-slate-200 py-8 text-center" aria-live="polite">
          <h2 className="font-semibold text-slate-900">{loading ? "Searching professionals" : searched ? "No verified profiles to show" : "Search the professional directory"}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
            {message || "Search by name, role, skills, or location. JobUp does not display sample or unverified people."}
          </p>
        </div>
      )}
    </section>
  );
}
