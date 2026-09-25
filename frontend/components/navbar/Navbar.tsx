import { UserProfile } from "@/components/profile/UserProfile";

const navItems = [
  "Job Search",
  "People Search",
  "Career Advice",
  "Companies",
  
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm">
            J
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">JobUp</p>
          </div>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <button
              key={item}
              type="button"
              className={
                item === "Job Search"
                  ? "border-b-2 border-indigo-600 pb-1 text-sm font-medium text-indigo-700"
                  : "text-sm font-medium text-slate-600 transition hover:text-slate-900"
              }
            >
              {item}
            </button>
          ))}
        </nav>

        <UserProfile />
      </div>
    </header>
  );
}
