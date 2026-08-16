"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { requestPasswordReset, resetPassword } from "@/lib/auth";

type Step = "email" | "reset";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      if (step === "email") {
        await requestPasswordReset(email);
        setMessage("If the email exists, a one-time reset code has been sent.");
        setStep("reset");
        return;
      }

      await resetPassword(email, code, password);
      setMessage("Password changed. You can now sign in.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Password reset failed.");
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
        <h1 className="text-center text-3xl font-semibold text-ink">Reset password</h1>
        <p className="mt-3 text-center text-sm text-muted">
          {step === "email" ? "Enter your account email to receive a one-time password code." : "Enter the code from your email and choose a new password."}
        </p>

        <label className="mt-6 block text-sm font-medium text-ink">
          Email
          <input className="field mt-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={step === "reset"} />
        </label>

        {step === "reset" ? (
          <>
            <label className="mt-4 block text-sm font-medium text-ink">
              One-time password code
              <input className="field mt-2 tracking-[0.35em]" value={code} onChange={(e) => setCode(e.target.value)} required inputMode="numeric" maxLength={6} />
            </label>
            <label className="mt-4 block text-sm font-medium text-ink">
              New password
              <input className="field mt-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </label>
          </>
        ) : null}

        <button className="btn mt-6 w-full py-3" type="submit" disabled={submitting}>
          {submitting ? "Please wait..." : step === "email" ? "Send reset code" : "Change password"}
        </button>
        {message ? <p className="mt-4 text-sm text-muted">{message}</p> : null}
        <p className="mt-5 text-center text-sm text-muted">
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-brand">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
