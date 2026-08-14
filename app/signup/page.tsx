"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { saveSession, signup } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [routers, setRouters] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const session = await signup(name, email, password);
      saveSession(session);
      router.push("/dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Signup failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="app-shell grid min-h-screen gap-8 px-6 py-8 lg:grid-cols-[1fr_1.15fr_0.55fr] lg:items-center">
      <section className="hidden lg:block">
        <div className="mb-14 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-gradient-to-br from-accent to-sky-400 text-sm font-black text-slate-950">NF</span>
          <span className="text-2xl font-bold text-ink">NobliFi</span>
        </div>
        <h1 className="text-5xl font-semibold leading-tight text-ink">Run your <span className="text-accent">hotspot business</span> on NobliFi</h1>
        <p className="mt-5 text-lg text-muted">Start a free 30-day trial, add your routers, sell vouchers, and manage billing from one place.</p>
        <ul className="mt-8 space-y-3 text-sm text-muted">
          {["Router onboarding", "Voucher management", "Usage analytics", "Remote access", "Payment tracking", "Captive portal templates"].map((item) => <li key={item}>+ {item}</li>)}
        </ul>
      </section>
      <form onSubmit={submit} className="panel w-full p-6 lg:p-8">
        <h1 className="text-3xl font-semibold text-ink">Start your 30-day free trial</h1>
        <p className="mt-2 text-sm text-muted">Tell us about your business to activate NobliFi.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-ink">
          Business name
          <input className="field mt-2" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="block text-sm font-medium text-ink">
          Contact person
          <input className="field mt-2" value={contact} onChange={(e) => setContact(e.target.value)} required />
        </label>
        <label className="block text-sm font-medium text-ink">
          Email
          <input className="field mt-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block text-sm font-medium text-ink">
          Phone number
          <input className="field mt-2" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </label>
        <label className="block text-sm font-medium text-ink">
          Business location
          <input className="field mt-2" value={location} onChange={(e) => setLocation(e.target.value)} required />
        </label>
        <label className="block text-sm font-medium text-ink">
          Number of routers
          <input className="field mt-2" value={routers} onChange={(e) => setRouters(e.target.value)} required />
        </label>
        <label className="block text-sm font-medium text-ink">
          Password
          <input className="field mt-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </label>
        </div>
        <button className="btn mt-6 w-full py-3" type="submit" disabled={submitting}>
          {submitting ? "Creating account..." : "Create account"}
        </button>
        {message ? <p className="mt-4 text-sm text-red-600">{message}</p> : null}
        <p className="mt-5 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand">
            Sign in
          </Link>
        </p>
      </form>
      <aside className="panel hidden p-6 lg:block">
        <h2 className="text-lg font-semibold text-ink">Trial includes</h2>
        <ul className="mt-6 space-y-4 text-sm text-muted">
          {["Up to 3 routers", "5,000 vouchers", "2 admin users", "Core analytics", "Standard support"].map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p className="mt-8 border-t border-line pt-6 text-sm text-muted">Full access to core features for 30 days. No credit card required.</p>
      </aside>
    </main>
  );
}
