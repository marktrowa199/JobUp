import Link from "next/link";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicNavbar } from "@/components/public/PublicNavbar";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <PublicNavbar />
      <main className="mx-auto max-w-4xl px-5 py-20 sm:px-8 lg:py-28">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-indigo-600">About JobUp</p>
        <h1 className="mt-5 max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl">A calmer way to move through your job search.</h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">JobUp brings job discovery, role understanding, and application preparation into one focused career workspace.</p>
        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {["Search with context", "Prepare with clarity", "Keep moving forward"].map((title, index) => (
            <article key={title} className="border-t-2 border-indigo-200 pt-5">
              <p className="text-sm font-bold text-indigo-600">0{index + 1}</p>
              <h2 className="mt-4 text-lg font-bold text-slate-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Tools that help you make a thoughtful next move, without promising more than the work can deliver.</p>
            </article>
          ))}
        </div>
        <Link href="/register" className="mt-12 inline-flex rounded-full bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-indigo-500">Create Your Workspace</Link>
      </main>
      <PublicFooter />
    </div>
  );
}
