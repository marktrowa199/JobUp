import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
        <div>
          <Link href="/" className="text-lg font-bold tracking-tight text-slate-950">
            Job<span className="text-indigo-600">Up</span>
          </Link>
          <p className="mt-1 text-sm text-slate-500">Find your opportunity. Build your future.</p>
        </div>
        <p className="text-sm text-slate-400">© 2026 JobUp. All rights reserved.</p>
      </div>
    </footer>
  );
}
