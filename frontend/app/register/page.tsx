import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { PublicNavbar } from "@/components/public/PublicNavbar";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <PublicNavbar />
      <main className="mx-auto flex max-w-xl px-5 py-16 sm:px-8 lg:py-24">
        <section className="w-full rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_24px_70px_-35px_rgba(30,41,59,0.45)] sm:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-indigo-600">Start with JobUp</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">Build your workspace</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Create your account to save searches and continue to your JobUp workspace.</p>
          <AuthForm mode="register" />
          <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">Log in</Link></p>
        </section>
      </main>
    </div>
  );
}
