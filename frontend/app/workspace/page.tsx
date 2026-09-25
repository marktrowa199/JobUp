import { Navbar } from "@/components/navbar/Navbar";
import { JobSearch } from "@/components/job-search/JobSearch";
import { ProtectedWorkspace } from "@/components/auth/ProtectedWorkspace";

export default function WorkspacePage() {
  return (
    <ProtectedWorkspace>
      <main className="min-h-screen bg-slate-100 text-slate-900">
        <Navbar />
        <JobSearch />
      </main>
    </ProtectedWorkspace>
  );
}
