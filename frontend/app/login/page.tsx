import Link from "next/link";
import { PublicNavbar } from "@/components/public/PublicNavbar";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <PublicNavbar />
      <main className="mx-auto flex max-w-xl px-5 py-16 sm:px-8 lg:py-24">
        <section className="w-full rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_24px_70px_-35px_rgba(30,41,59,0.45)] sm:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-indigo-600">Welcome back</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">Log in to JobUp</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Authentication is coming next. Your workspace is ready at <Link href="/workspace" className="font-semibold text-indigo-600 hover:text-indigo-500">/workspace</Link> for now.</p>
          <form className="mt-8 space-y-5">
            <label className="block text-sm font-semibold text-slate-700">Email<input type="email" placeholder="you@example.com" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500" /></label>
            <label className="block text-sm font-semibold text-slate-700">Password<input type="password" placeholder="Enter your password" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500" /></label>
            <button type="submit" className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-indigo-500">Log In</button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">New to JobUp? <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">Create an account</Link></p>
        </section>
      </main>
    </div>
  );
}
