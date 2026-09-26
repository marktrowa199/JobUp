import { Navbar } from "@/components/navbar/Navbar";
import { ProtectedWorkspace } from "@/components/auth/ProtectedWorkspace";
import { ApplicationOverview } from "@/components/jobs/ApplicationOverview";
import { WorkspaceLanding } from "@/components/workspace/WorkspaceLanding";

export default function WorkspacePage() {
  return (
    <ProtectedWorkspace>
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar />
        <WorkspaceLanding />
      </main>
    </ProtectedWorkspace>
  );
}
