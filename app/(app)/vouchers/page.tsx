"use client";

import { FormEvent, useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

type Voucher = {
  id: string;
  code: string;
  status: string;
  plan_id: string;
  used_at?: string | null;
};
type Plan = { id: string; name: string; price: number; duration_minutes: number; download_speed: string; upload_speed: string };

export default function VouchersPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [planId, setPlanId] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const planById = new Map(plans.map((plan) => [plan.id, plan]));

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/plans`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data: Plan[]) => {
        setPlans(data);
        setPlanId((current) => current || data[0]?.id || "");
      })
      .catch(() => setPlans([]));

    const loadVouchers = () => {
      fetch(`${API_BASE_URL}/api/v1/vouchers`)
        .then((response) => (response.ok ? response.json() : []))
        .then((data: Voucher[]) => setVouchers(data))
        .catch(() => setVouchers([]));
    };

    loadVouchers();
    const interval = window.setInterval(loadVouchers, 10000);
    return () => window.clearInterval(interval);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/vouchers/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planId, quantity: Number(quantity) })
      });

      const body = await response.json().catch(() => null);

      if (response.ok) {
        // Success: body is a plain Voucher[]
        const generated = (body ?? []) as Voucher[];
        setVouchers((current) => [...generated, ...current]);
        return;
      }

      if (response.status === 207 && body?.vouchers) {
        // Partial failure: backend still created the vouchers, but one or
        // more failed to sync to RADIUS. Show them AND surface the error,
        // since a voucher that exists here but isn't in RADIUS will fail
        // authentication at the router with no obvious cause otherwise.
        const generated = (body.vouchers ?? []) as Voucher[];
        setVouchers((current) => [...generated, ...current]);
        setError(
          body.error ??
            "Some vouchers were created but failed to sync to RADIUS. They will not work until re-synced."
        );
        return;
      }

      setError(body?.error ?? body?.message ?? "Failed to generate vouchers. Please try again.");
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Vouchers</h1>

      {error && (
        <div className="panel mt-4 border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="panel mt-6 flex flex-col gap-4 p-5 md:flex-row md:items-end">
        <label className="flex-1 text-sm font-medium text-ink">
          Package
          <select className="field mt-2" value={planId} onChange={(e) => setPlanId(e.target.value)}>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} - UGX {plan.price.toLocaleString()}
              </option>
            ))}
          </select>
        </label>
        <label className="w-full text-sm font-medium text-ink md:w-48">
          Quantity
          <input className="field mt-2" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </label>
        <button className="btn" type="submit" disabled={!planId || submitting}>
          {submitting ? "Generating..." : "Generate"}
        </button>
      </form>

      <div className="panel mt-6 divide-y divide-line">
        {vouchers.map((voucher) => {
          const status = voucherStatus(voucher);

          return (
            <div key={voucher.id} className="grid gap-3 p-4 text-sm md:grid-cols-4">
              <span className="font-mono font-semibold text-ink">{voucher.code}</span>
              <span className="text-muted">{planById.get(voucher.plan_id)?.name ?? voucher.plan_id}</span>
              <span className="text-muted">
                {planById.get(voucher.plan_id)
                  ? `${planById.get(voucher.plan_id)?.duration_minutes} min - ${planById.get(voucher.plan_id)?.download_speed} down`
                  : "Package details unavailable"}
              </span>
              <span className="flex flex-col items-start gap-1">
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                  {status.label}
                </span>
                {status.detail ? <span className="text-xs text-muted">{status.detail}</span> : null}
              </span>
            </div>
          );
        })}
        {vouchers.length === 0 && <div className="p-4 text-sm text-muted">No vouchers generated yet.</div>}
      </div>
    </div>
  );
}

function voucherStatus(voucher: Voucher) {
  const normalizedStatus = voucher.status.trim().toLowerCase();

  if (normalizedStatus === "used" || voucher.used_at) {
    return {
      label: "Used",
      detail: voucher.used_at ? `Consumed ${formatDateTime(voucher.used_at)}` : null,
      className: "border-red-400/40 bg-red-500/10 text-red-300"
    };
  }

  if (normalizedStatus === "unused") {
    return {
      label: "Unused",
      detail: null,
      className: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
    };
  }

  return {
    label: titleCase(voucher.status || "unknown"),
    detail: null,
    className: "border-line bg-white/5 text-muted"
  };
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function titleCase(value: string) {
  return value
    .trim()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
