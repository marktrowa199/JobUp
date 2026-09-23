type LocationDropdownProps = {
  isOpen: boolean;
  options: string[];
  onSelect: (location: string) => void;
};

export function LocationDropdown({ isOpen, options, onSelect }: LocationDropdownProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Recent
      </div>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onSelect(option)}
          className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
