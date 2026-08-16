"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState, OperationsTitle } from "@/components/OperationsUI";
import { apiFetch } from "@/lib/api";
import { getStoredUser, getToken, type AuthUser } from "@/lib/auth";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0
  }).format(value);
}

function getRemainingDays(trialEndsAt?: string | null) {
  if (!trialEndsAt) {
    return null;
  }

  const endDate = new Date(trialEndsAt);
  if (Number.isNaN(endDate.getTime())) {
    return null;
  }

  const diffMs = endDate.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export default function SubscriptionsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    async function loadUser() {
      const token = getToken();
      if (!token) {
        setUser(getStoredUser());
        return;
      }

      try {
        const { user } = await apiFetch<{ user: AuthUser }>('/api/v1/auth/me');
        localStorage.setItem('noblifi_user', JSON.stringify(user));
        setUser(user);
      } catch {
        setUser(getStoredUser());
      }
    }

    loadUser();
  }, []);

  const remainingDays = useMemo(() => getRemainingDays(user?.trial_ends_at), [user]);
  const hasTrial = Boolean(user?.trial_ends_at);
  const activePlan = user?.billing_plan || "Free trial";
  const billedAmount = user?.monthly_price_ugx ? formatCurrency(user.monthly_price_ugx) : "UGX 0";
  const endDateText = user?.trial_ends_at
    ? new Date(user.trial_ends_at).toLocaleDateString("en-UG", { month: "short", day: "numeric", year: "numeric" })
    : "No end date set";

  if (!user) {
    return (
      <>
        <OperationsTitle title="Subscriptions" description="Review your active plan, your free-trial countdown, and your renewal status." />
        <EmptyState title="No subscription data available" description="Sign in again or complete your trial setup to see your subscription status here." />
      </>
    );
  }

  const statusText = hasTrial && remainingDays !== null && remainingDays > 0
    ? "Free trial"
    : hasTrial && remainingDays === 0
      ? "Trial ending today"
      : "Active plan";

  const trialExpired = hasTrial && remainingDays !== null && remainingDays <= 0;

  return (
    <>
      <OperationsTitle title="Subscriptions" description="Review your active plan, your free-trial countdown, and your renewal status." />

      <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="panel p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Current plan</p>
              <h2 className="mt-3 text-3xl font-semibold text-ink">{activePlan}</h2>
            </div>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-accent">
              {statusText}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-md border border-line bg-soft/50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Days remaining</p>
              <p className="mt-3 text-4xl font-bold text-ink">{remainingDays ?? 0}</p>
              <p className="mt-1 text-sm text-muted">{(remainingDays ?? 0) === 1 ? "day left" : "days left"}</p>
            </div>

            <div className="rounded-md border border-line bg-soft/50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Monthly price</p>
              <p className="mt-3 text-2xl font-bold text-ink">{billedAmount}</p>
              <p className="mt-1 text-sm text-muted">billed monthly</p>
            </div>

            <div className="rounded-md border border-line bg-soft/50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Trial ends</p>
              <p className="mt-3 text-lg font-bold text-ink">{endDateText}</p>
              <p className="mt-1 text-sm text-muted">renewal date</p>
            </div>
          </div>

          <div className="mt-6 rounded-md border border-accent/30 bg-emerald-500/5 p-4">
            <p className="text-sm text-ink">
              {remainingDays !== null && remainingDays > 0
                ? `Your free trial still has ${remainingDays} day${remainingDays === 1 ? "" : "s"} left before renewal.`
                : remainingDays === 0
                  ? "Your trial ends today. Upgrade before the renewal window closes to keep service active."
                  : "You are currently on an active subscription plan and your renewal status is in good standing."}
            </p>
          </div>

          {trialExpired ? (
            <div className="mt-5 rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Subscription required</p>
              <p className="mt-3 text-xl font-semibold text-amber-50">Your free trial has expired</p>
              <p className="mt-2 text-sm text-amber-100/90">Plan creation and voucher generation are locked until you pay to subscribe and continue using NobliFi.</p>
              <button
                type="button"
                className="btn mt-4 w-full bg-amber-500 text-slate-950 hover:bg-amber-400"
                onClick={() => window.open("https://iotec.co.ug", "_blank", "noopener,noreferrer")}
              >
                Pay to subscribe
              </button>
            </div>
          ) : null}
        </div>

        <div className="panel p-6">
          <h3 className="text-lg font-semibold text-ink">Plan details</h3>
          <ul className="mt-5 space-y-4 text-sm text-muted">
            <li className="flex items-center justify-between gap-3 border-b border-line pb-3">
              <span>Workspace</span>
              <span className="font-semibold text-ink">{user.hotspot_name}</span>
            </li>
            <li className="flex items-center justify-between gap-3 border-b border-line pb-3">
              <span>Owner</span>
              <span className="font-semibold text-ink">{user.name}</span>
            </li>
            <li className="flex items-center justify-between gap-3 border-b border-line pb-3">
              <span>Email</span>
              <span className="font-semibold text-ink">{user.email}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Access</span>
              <span className="font-semibold text-ink">{user.role}</span>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
