"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, saveSession, verifyLoginMFA } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@noblifi.local");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [devCode, setDevCode] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      if (mfaRequired) {
        const session = await verifyLoginMFA(email.trim(), code.trim());
        saveSession(session);
        router.push("/dashboard");
        return;
      }

      const response = await login(email.trim(), password);
      if (response.mfa_required) {
        setMfaRequired(true);
        setDevCode(response.delivery?.dev_code ?? "");
        setMessage(response.message || "A 6-digit verification code has been sent to your email.");
        setCode("");
        return;
      }

      if (response.token && response.user) {
        saveSession({ token: response.token, user: response.user });
        router.push("/dashboard");
        return;
      }

      throw new Error("Login response did not include the session token.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="app-shell flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="panel w-full max-w-xl p-8">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-accent to-sky-400 text-base font-black text-slate-950">NF</span>
          <span className="text-2xl font-bold text-ink">NobliFi</span>
        </div>
        <h1 className="text-center text-3xl font-semibold text-ink">NobliFi Admin</h1>
        <p className="mt-3 text-center text-sm text-muted">{mfaRequired ? "Enter the one-time code from your email to continue." : "Sign in to manage routers, plans, and vouchers."}</p>

        {!mfaRequired ? (
          <>
            <label className="mt-6 block text-sm font-medium text-ink">
              Email
              <input className="field mt-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="mt-4 block text-sm font-medium text-ink">
              Password
              <input className="field mt-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <div className="mt-3 text-right">
              <Link href="/forgot-password" className="text-sm font-semibold text-brand">
                Forgot password?
              </Link>
            </div>
          </>
        ) : (
          <label className="mt-6 block text-sm font-medium text-ink">
            One-time code
            <input className="field mt-2 tracking-[0.35em]" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} />
          </label>
        )}

        {devCode ? (
          <div className="mt-4 rounded-md border border-line bg-white/70 px-4 py-3 text-sm text-ink">
            Development code: <span className="font-mono text-lg font-semibold tracking-[0.25em]">{devCode}</span>
          </div>
        ) : null}

        <button className="btn mt-6 w-full py-3" type="submit" disabled={submitting}>
          {submitting ? (mfaRequired ? "Verifying..." : "Signing in...") : mfaRequired ? "Verify code" : "Sign in"}
        </button>
        {message ? <p className="mt-4 text-sm text-red-600">{message}</p> : null}
        <p className="mt-5 text-center text-sm text-muted">
          New to NobliFi?{" "}
          <Link href="/signup" className="font-semibold text-brand">
            Create an account
          </Link>
        </p>
      </form>
    </main>
  );
}
