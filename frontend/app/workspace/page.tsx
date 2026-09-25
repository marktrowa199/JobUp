import { Navbar } from "@/components/navbar/Navbar";
import { JobSearch } from "@/components/job-search/JobSearch";

export default function WorkspacePage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <Navbar />
      <JobSearch />
    </main>
  );
}
