type FilterConfig = {
  label: string;
  name: "pay" | "jobType" | "remote" | "classification" | "listingTime";
  options: string[];
};

type SearchFiltersProps = {
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
};

const filterConfigs: FilterConfig[] = [
  { label: "Pay", name: "pay", options: ["Any", "PHP 35k - 50k", "PHP 40k - 60k", "PHP 50k - 80k", "PHP 60k - 90k"] },
  { label: "Job Type", name: "jobType", options: ["Any", "Full Time", "Part Time", "Contract", "Hybrid"] },
  { label: "Remote", name: "remote", options: ["Any", "On-site", "Remote", "Hybrid"] },
  { label: "Classification", name: "classification", options: ["Any", "IT & Software", "IT Support", "Data & Analytics", "Software Engineering", "Web Development"] },
  { label: "Listing Time", name: "listingTime", options: ["Any", "Today", "1 day ago", "2 days ago", "3 days ago", "1 week ago"] },
];

export function SearchFilters({ values, onChange }: SearchFiltersProps) {
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {filterConfigs.map((filter) => (
        <label
          key={filter.name}
          className="relative inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"
        >
          <span className="mr-2">{filter.label}</span>
          <select
            value={values[filter.name] ?? "Any"}
            onChange={(event) => onChange(filter.name, event.target.value)}
            className="appearance-none bg-transparent pr-5 text-sm font-medium text-slate-700 outline-none"
            aria-label={filter.label}
          >
            {filter.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span aria-hidden="true" className="pointer-events-none absolute right-3 text-slate-400">
            ▾
          </span>
        </label>
      ))}
    </div>
  );
}
