"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { login, saveSession } from "@/lib/auth";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("admin@noblifi.local");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const session = await login(email.trim(), password);

      saveSession(session);

      const nextPath = getSafeNextPath(searchParams.get("next"));

      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Login failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-app px-4">
      <form
        onSubmit={submit}
        className="panel w-full max-w-md p-6"
      >
        <h1 className="text-2xl font-semibold text-ink">
          NobliFi Admin
        </h1>

        <p className="mt-2 text-sm text-muted">
          Sign in to manage routers, plans, and vouchers.
        </p>

        <label className="mt-6 block text-sm font-medium text-ink">
          Email
          <input
            className="field mt-2"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            disabled={submitting}
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-ink">
          Password
          <input
            className="field mt-2"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            disabled={submitting}
          />
        </label>

        <button
          className="btn mt-6 w-full"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>

        {message ? (
          <p
            className="mt-4 text-sm text-red-600"
            role="alert"
          >
            {message}
          </p>
        ) : null}

        <p className="mt-5 text-center text-sm text-muted">
          New to NobliFi?{" "}
          <Link
            href="/signup"
            className="font-semibold text-brand"
          >
            Create an account
          </Link>
        </p>
      </form>
    </main>
  );
}

function getSafeNextPath(next: string | null): string {
  if (!next) {
    return "/dashboard";
  }

  // Prevent redirects to external websites.
  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}