const adviceTopics = [
  {
    category: "Resume",
    title: "Make experience easy to scan",
    points: [
      "Put your strongest and most relevant experience near the top.",
      "Describe outcomes with action verbs and measurable results where you can.",
      "Use clear section headings and keep formatting simple for applicant tracking systems.",
    ],
  },
  {
    category: "Interview",
    title: "Prepare specific examples",
    points: [
      "Use Situation, Task, Action, Result to structure concise stories.",
      "Practice explaining decisions, trade-offs, and what you learned.",
      "Bring thoughtful questions about the team's goals and day-to-day work.",
    ],
  },
  {
    category: "Job search",
    title: "Build a focused weekly routine",
    points: [
      "Prioritize roles that fit your skills and the direction you want to grow.",
      "Tailor a few relevant resume details for each application instead of mass-applying.",
      "Track the role, date, contact, and next follow-up for every application.",
    ],
  },
  {
    category: "Early career",
    title: "Show evidence of how you work",
    points: [
      "Include internships, coursework, volunteer work, and personal projects when relevant.",
      "Describe your contribution clearly, even when the project was completed by a team.",
      "Search for junior, associate, trainee, and apprenticeship roles to find entry points.",
    ],
  },
  {
    category: "Technical careers",
    title: "Connect fundamentals to practical work",
    points: [
      "Strengthen core concepts before collecting more tools on your resume.",
      "Keep a small portfolio with readable code, setup instructions, and a clear explanation.",
      "Practice debugging, testing, version control, and explaining technical choices.",
    ],
  },
  {
    category: "Skills employers value",
    title: "Pair technical skill with collaboration",
    points: [
      "Communicate progress, blockers, and assumptions early and clearly.",
      "Show how you break down ambiguous tasks and respond to feedback.",
      "Make role-specific skills visible through examples rather than a long keyword list.",
    ],
  },
];

export function CareerAdvice() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-labelledby="career-advice-title">
      <div className="mb-8 border-b border-slate-200 pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Practical guidance</p>
        <h1 id="career-advice-title" className="mt-2 text-3xl font-bold text-slate-900">Career Advice</h1>
        <p className="mt-2 max-w-2xl text-slate-600">Useful steps for presenting your experience, preparing for interviews, and moving your search forward.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {adviceTopics.map((topic) => (
          <article key={topic.category} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">{topic.category}</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">{topic.title}</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              {topic.points.map((point) => <li key={point} className="border-l-2 border-emerald-200 pl-3">{point}</li>)}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
