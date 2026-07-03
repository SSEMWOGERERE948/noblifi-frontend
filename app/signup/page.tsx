"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { saveSession, signup } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
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
    <main className="flex min-h-screen items-center justify-center bg-app px-4">
      <form onSubmit={submit} className="panel w-full max-w-md p-6">
        <h1 className="text-2xl font-semibold text-ink">Create NobliFi Account</h1>
        <p className="mt-2 text-sm text-muted">Sign up to manage routers, plans, and vouchers.</p>
        <label className="mt-6 block text-sm font-medium text-ink">
          Name
          <input className="field mt-2" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="mt-4 block text-sm font-medium text-ink">
          Email
          <input className="field mt-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="mt-4 block text-sm font-medium text-ink">
          Password
          <input className="field mt-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </label>
        <button className="btn mt-6 w-full" type="submit" disabled={submitting}>
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
    </main>
  );
}

