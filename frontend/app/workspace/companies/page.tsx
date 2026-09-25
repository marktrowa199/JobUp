import { ProtectedWorkspace } from "@/components/auth/ProtectedWorkspace";
import { CompanyDirectory } from "@/components/companies/CompanyDirectory";
import { Navbar } from "@/components/navbar/Navbar";

export default function CompaniesPage() {
  return (
    <ProtectedWorkspace>
      <main className="min-h-screen bg-slate-100 text-slate-900">
        <Navbar />
        <CompanyDirectory />
      </main>
    </ProtectedWorkspace>
  );
}
