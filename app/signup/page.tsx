"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { resendVerification, saveSession, signup, verifyEmail } from "@/lib/auth";

type Step = "billing" | "account" | "verify";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("billing");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [routers, setRouters] = useState("");
  const [hotspotName, setHotspotName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [devCode, setDevCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      if (step === "account") {
        const result = await signup(name, email, password, hotspotName);
        setDevCode(result.delivery?.dev_code ?? "");
        setMessage(codeMessage(result.message, result.delivery?.dev_code));
        setStep("verify");
        return;
      }

      const session = await verifyEmail(email, code);
      saveSession(session);
      router.push("/dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Signup failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function resendCode() {
    setSubmitting(true);
    setMessage("");

    try {
      const result = await resendVerification(email);
      setDevCode(result.delivery?.dev_code ?? "");
      setMessage(codeMessage(result.message, result.delivery?.dev_code));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not resend the code.");
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
        <p className="mt-5 text-lg text-muted">Review the monthly package first, start a free 30-day trial, then confirm your real email before access.</p>
        <ul className="mt-8 space-y-3 text-sm text-muted">
          {["Router onboarding", "Voucher management", "Usage analytics", "Remote access", "Payment tracking", "Captive portal templates"].map((item) => <li key={item}>+ {item}</li>)}
        </ul>
      </section>

      {step === "billing" ? (
        <section className="panel w-full p-6 lg:p-8">
          <p className="text-sm font-semibold text-brand">Billing package</p>
          <h1 className="mt-3 text-3xl font-semibold text-ink">NobliFi Monthly</h1>
          <div className="mt-6 flex items-end gap-2">
            <span className="text-5xl font-semibold text-ink">25,000</span>
            <span className="pb-2 text-sm font-semibold text-muted">UGX / month</span>
          </div>
          <p className="mt-5 text-sm text-muted">Start with a free 30-day trial after reviewing the package. Billing starts after the trial unless you cancel.</p>
          <div className="mt-8 grid gap-3 text-sm text-muted md:grid-cols-2">
            {["Full router management", "Voucher sales tracking", "Captive portal controls", "Usage analytics", "Remote setup support", "Admin dashboard access"].map((item) => (
              <div key={item} className="rounded-md border border-line px-3 py-3">{item}</div>
            ))}
          </div>
          <button className="btn mt-8 w-full py-3" type="button" onClick={() => setStep("account")}>
            Start free trial
          </button>
          <p className="mt-5 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand">
              Sign in
            </Link>
          </p>
        </section>
      ) : (
        <form onSubmit={submit} className="panel w-full p-6 lg:p-8">
          <h1 className="text-3xl font-semibold text-ink">{step === "account" ? "Create your account" : "Confirm your email"}</h1>
          <p className="mt-2 text-sm text-muted">
            {step === "account"
              ? "Use a real email. We will send a one-time code before login is allowed."
              : `Enter the one-time code sent to ${email}.`}
          </p>
          {step === "account" ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-ink">
                Business name
                <input className="field mt-2" value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label className="block text-sm font-medium text-ink">
                Hotspot name
                <input className="field mt-2" value={hotspotName} onChange={(e) => setHotspotName(e.target.value)} required placeholder="e.g. Cafe Guest WiFi" />
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
              <label className="block text-sm font-medium text-ink md:col-span-2">
                Password
                <input className="field mt-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              </label>
            </div>
          ) : (
            <>
              <label className="mt-6 block text-sm font-medium text-ink">
                One-time password code
                <input className="field mt-2 tracking-[0.35em]" value={code} onChange={(e) => setCode(e.target.value)} required inputMode="numeric" maxLength={6} />
              </label>
              {devCode ? (
                <div className="mt-4 rounded-md border border-line bg-white/70 px-4 py-3 text-sm text-ink">
                  Development code: <span className="font-mono text-lg font-semibold tracking-[0.25em]">{devCode}</span>
                </div>
              ) : null}
            </>
          )}
          <button className="btn mt-6 w-full py-3" type="submit" disabled={submitting}>
            {submitting ? "Please wait..." : step === "account" ? "Create account and send code" : "Confirm account"}
          </button>
          {step === "verify" ? (
            <button className="mt-4 w-full text-sm font-semibold text-brand" type="button" onClick={resendCode} disabled={submitting}>
              Resend code
            </button>
          ) : null}
          {message ? <p className="mt-4 text-sm text-red-600">{message}</p> : null}
          <p className="mt-5 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand">
              Sign in
            </Link>
          </p>
        </form>
      )}

      <aside className="panel hidden p-6 lg:block">
        <h2 className="text-lg font-semibold text-ink">Trial includes</h2>
        <ul className="mt-6 space-y-4 text-sm text-muted">
          {["Up to 3 routers", "5,000 vouchers", "2 admin users", "Core analytics", "Standard support"].map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p className="mt-8 border-t border-line pt-6 text-sm text-muted">UGX 25,000 per month after the free trial. Email verification is required before dashboard access.</p>
      </aside>
    </main>
  );
}

function codeMessage(message: string, devCode?: string) {
  if (devCode) {
    return `${message} Enter the development code shown below.`;
  }
  return message || "Enter the one-time code sent to your email to confirm the account.";
}
