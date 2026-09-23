type RecentSearchItem = {
  job: string;
  location: string;
  type: string;
};

type RecentSearchesProps = {
  items: RecentSearchItem[];
  onSelect: (item: RecentSearchItem) => void;
};

export function RecentSearches({ items, onSelect }: RecentSearchesProps) {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-xl font-bold text-slate-900">Recent Searches</h3>
      <div className="mt-5 space-y-3">
        {items.map((item, index) => (
          <button
            key={`${item.job}-${item.location}-${index}`}
            type="button"
            onClick={() => onSelect(item)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50"
          >
            <p className="text-base font-semibold text-slate-900">{item.job}</p>
            <p className="mt-1 text-sm text-slate-600">{item.location}</p>
            <div className="mt-2 inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
              {item.type}
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
