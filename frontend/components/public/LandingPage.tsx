import Link from "next/link";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicNavbar } from "@/components/public/PublicNavbar";
import { HomepageCarousel } from "@/components/public/HomepageCarousel";
import { LocationMap } from "@/components/public/LocationMap";

const workflow = [
  {
    number: "01",
    title: "Create Your Workspace",
    description: "Create your JobUp account and build your career profile.",
  },
  {
    number: "02",
    title: "Find Opportunities",
    description: "Search real job opportunities based on your skills, role, and preferred location.",
  },
  {
    number: "03",
    title: "Understand Your Match",
    description: "Analyze job requirements and compare them with your skills and experience.",
  },
  {
    number: "04",
    title: "Apply With Confidence",
    description: "Prepare your application and continue to the actual employer or job-platform application page.",
  },
];

const values = [
  ["Find relevant jobs", "Search real opportunities using job title, skills, keywords, and location."],
  ["Understand requirements", "Analyze job descriptions and identify the skills employers are looking for."],
  ["Build your career workspace", "Keep your resume, applications, searches, and career tools organized in one place."],
  ["Prepare before you apply", "Use JobUp's tools to understand the role and prepare your application."],
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <PublicNavbar />

      <main>
        <section className="relative overflow-hidden border-b border-slate-200/80 bg-white">
          <div className="pointer-events-none absolute -right-32 -top-36 h-96 w-96 rounded-full bg-indigo-100/70 blur-3xl" aria-hidden="true" />
          <div className="mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-28">
            <div className="relative">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-indigo-600">A clearer next step</p>
              <h1 className="mt-5 max-w-3xl text-5xl font-bold leading-[1.04] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                Your next opportunity
                <span className="block text-indigo-600">starts here.</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
                Find opportunities that match your skills, build your career, and take the next step with confidence.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-500">
                  Build My Workspace <span className="ml-2" aria-hidden="true">→</span>
                </Link>
                <a href="#how-it-works" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700">
                  How It Works
                </a>
              </div>

              <blockquote className="mt-12 max-w-lg border-l-2 border-indigo-300 pl-5 text-base italic leading-7 text-slate-500">
                “Every application is a step closer to the opportunity that&apos;s right for you.”
              </blockquote>
            </div>

            <div className="relative lg:pl-10">
              <div className="rounded-[2rem] border border-slate-200 bg-[#f7f9fc] p-5 shadow-[0_24px_70px_-35px_rgba(30,41,59,0.45)] sm:p-7">
                <div className="flex items-center justify-between border-b border-slate-200 pb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Your career workspace</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">Move with intention</p>
                  </div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-bold text-white">J</span>
                </div>
                <div className="mt-6 space-y-3">
                  {[
                    ["01", "Search real opportunities", "By role, skill, and location"],
                    ["02", "See what matters", "Understand requirements before applying"],
                    ["03", "Prepare your next move", "Keep your application focused"],
                  ].map(([number, title, description]) => (
                    <div key={number} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-700">{number}</span>
                      <div>
                        <p className="font-semibold text-slate-900">{title}</p>
                        <p className="mt-1 text-sm text-slate-500">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  Built for the work between searching and applying
                </div>
              </div>
            </div>
          </div>
        </section>

        <LocationMap />

        <section id="how-it-works" className="scroll-mt-8 border-b border-slate-200 bg-[#f7f9fc]">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-indigo-600">A simple rhythm</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">How JobUp Works</h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">From the first search to a better-prepared application, keep your next move in view.</p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {workflow.map((step) => (
                <article key={step.number} className="border-t-2 border-indigo-200 pt-5 transition duration-200 hover:-translate-y-1">
                  <p className="text-sm font-bold text-indigo-600">{step.number}</p>
                  <h3 className="mt-5 text-lg font-bold text-slate-900">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <HomepageCarousel />

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-indigo-600">Built around you</p>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">More than a job board.</h2>
                <p className="mt-5 max-w-md text-lg leading-8 text-slate-600">JobUp gives you a practical place to search, understand, and prepare without losing the thread of your career.</p>
              </div>
              <div className="grid gap-x-10 gap-y-9 sm:grid-cols-2">
                {values.map(([title, description]) => (
                  <article key={title} className="transition duration-200 hover:-translate-y-1">
                    <span className="mb-4 block h-2 w-10 rounded-full bg-indigo-500" aria-hidden="true" />
                    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-indigo-600">
          <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 py-16 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-indigo-200">Your next move is yours to make</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">Turn your search into a plan.</h2>
            </div>
            <Link href="/register" className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50">
              Build My Workspace <span className="ml-2" aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
