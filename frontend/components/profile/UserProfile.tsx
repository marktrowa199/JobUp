export function UserProfile() {
  return (
    <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-2 py-2 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
        AR
      </div>
      <div className="hidden text-left sm:block">
        <p className="text-sm font-semibold text-slate-900">Arthur Rocacurva</p>
        <p className="text-xs text-slate-500">Job Seeker</p>
      </div>
      <span aria-hidden="true" className="text-slate-400">
        ▾
      </span>
    </div>
  );
}
