export type JobSearchFilters = {
  pay: string;
  jobType: string;
  remote: string;
  classification: string;
  listingTime: string;
};

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  remote: string;
  classification: string;
  pay: string;
  listingTime: string;
  match: number | null;
  description: string;
  summary: string;
  skills: string[];
  source: string;
  url: string;
};

export const locationOptions = [
  "Philippines",
  "Manila",
  "Cubao, Quezon City, Metro Manila",
  "Quezon City, Metro Manila",
  "Metro Manila",
  "Mandaluyong City, Metro Manila",
  "Fairview, Quezon City",
  "Bulacan, Central Luzon",
  "Makati City, Metro Manila",
  "Taguig City, Metro Manila",
  "Pasig City, Metro Manila",
  "Cebu City, Central Visayas",
  "Cebu",
  "Davao",
  "Pampanga",
  "Angeles City",
];

export const recentSearches = [
  { job: "Python Developer", location: "Quezon City", type: "Full Time" },
  { job: "IT Support", location: "Metro Manila", type: "Full Time" },
  { job: "Data Analyst", location: "Makati", type: "Hybrid" },
  { job: "Frontend Developer", location: "Taguig", type: "Remote" },
];

export const defaultFilters: JobSearchFilters = {
  pay: "Any",
  jobType: "Any",
  remote: "Any",
  classification: "Any",
  listingTime: "Any",
};

export function normalizeJobFromApi(item: {
  id?: string;
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  salary?: string;
  jobType?: string;
  job_type?: string;
  remote?: string;
  posted_date?: string;
  source?: string;
  url?: string;
  postedDate?: string;
}): Job {
  return {
    id: item.id ?? crypto.randomUUID(),
    title: item.title ?? "Not specified",
    company: item.company ?? "Not specified",
    location: item.location ?? "Not specified",
    type: item.jobType ?? item.job_type ?? "Not specified",
    remote: item.remote ?? "Not specified",
    classification: "Not specified",
    pay: item.salary ?? "Salary not specified",
    listingTime: item.postedDate ?? item.posted_date ?? "Posted recently",
    match: null,
    description: item.description ?? "No description available.",
    summary: item.description ?? "No description available.",
    skills: [],
    source: item.source ?? "Job Provider",
    url: item.url ?? "",
  };
}
