import { ProtectedWorkspace } from "@/components/auth/ProtectedWorkspace";
import { Navbar } from "@/components/navbar/Navbar";
import { PeopleSearch } from "@/components/people/PeopleSearch";

export default function PeopleSearchPage() {
  return (
    <ProtectedWorkspace>
      <main className="min-h-screen bg-slate-100 text-slate-900">
        <Navbar />
        <PeopleSearch />
      </main>
    </ProtectedWorkspace>
  );
}
