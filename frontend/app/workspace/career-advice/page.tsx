import { CareerAdvice } from "@/components/career-advice/CareerAdvice";
import { ProtectedWorkspace } from "@/components/auth/ProtectedWorkspace";
import { Navbar } from "@/components/navbar/Navbar";

export default function CareerAdvicePage() {
  return (
    <ProtectedWorkspace>
      <main className="min-h-screen bg-slate-100 text-slate-900">
        <Navbar />
        <CareerAdvice />
      </main>
    </ProtectedWorkspace>
  );
}
