"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

type Plan = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  download_speed: string;
  upload_speed: string;
  is_active: boolean;
};

type PaymentConfig = {
  provider: string;
  configured: boolean;
  currency: string;
};

type StartOrderResponse = {
  merchant_reference: string;
  order_tracking_id: string;
  redirect_url: string;
};

type PaymentStatus = {
  success: boolean;
  status: string;
  raw_status: string;
  merchant_reference: string;
  order_tracking_id: string;
  voucher?: string;
};

const trackingKey = "noblifi_pesapal_tracking";

export default function BuyVoucherPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activePlans = useMemo(
    () => plans.filter((plan) => plan.is_active).sort((a, b) => a.price - b.price),
    [plans]
  );
  const selectedPlan = activePlans.find((plan) => plan.id === selectedPlanId);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [configResponse, plansResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/v1/payments/config`, { cache: "no-store" }),
          fetch(`${API_BASE_URL}/api/v1/plans`, { cache: "no-store" })
        ]);

        const paymentConfig = (await configResponse.json()) as PaymentConfig;
        const planList = (await plansResponse.json()) as Plan[];
        if (cancelled) return;

        setConfig(paymentConfig);
        setPlans(planList);
        const requestedPlanID = new URLSearchParams(window.location.search).get("plan_id");
        const requestedPlan = planList.find((plan) => plan.is_active && plan.id === requestedPlanID);
        setSelectedPlanId((current) => current || requestedPlan?.id || planList.find((plan) => plan.is_active)?.id || "");
      } catch {
        if (!cancelled) setError("Could not load packages. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackingId =
      params.get("OrderTrackingId") ||
      params.get("orderTrackingId") ||
      params.get("order_tracking_id") ||
      window.sessionStorage.getItem(trackingKey);

    if (trackingId) {
      window.sessionStorage.setItem(trackingKey, trackingId);
      checkPayment(trackingId);
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlanId) return;

    setError(null);
    setStatus(null);
    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/payments/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: selectedPlanId,
          phone,
          email
        })
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message || body?.error || "Could not start Pesapal checkout.");
      }

      const order = body as StartOrderResponse;
      window.sessionStorage.setItem(trackingKey, order.order_tracking_id);
      window.location.href = order.redirect_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start Pesapal checkout.");
      setSubmitting(false);
    }
  }

  async function checkPayment(trackingId?: string) {
    const id = trackingId || window.sessionStorage.getItem(trackingKey);
    if (!id) {
      setError("No Pesapal tracking ID was found for this checkout.");
      return;
    }

    setError(null);
    setChecking(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/payments/orders/${encodeURIComponent(id)}/status`, {
        cache: "no-store"
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message || body?.error || "Could not verify payment.");
      }

      const result = body as PaymentStatus;
      setStatus(result);
      if (result.voucher) {
        window.sessionStorage.removeItem(trackingKey);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify payment.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <main className="min-h-screen bg-app px-4 py-8 text-ink">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-2xl font-semibold">Buy WiFi Voucher</h1>
        <p className="mt-2 text-sm text-muted">Choose a package and pay securely with Pesapal.</p>

        {error ? (
          <div className="panel mt-5 border-red-400/40 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>
        ) : null}

        {status ? (
          <div className="panel mt-5 p-5">
            <p className="text-sm text-muted">Payment status</p>
            <p className="mt-1 text-lg font-semibold capitalize">{status.status}</p>
            {status.raw_status ? <p className="mt-1 text-sm text-muted">{status.raw_status}</p> : null}
            {status.voucher ? (
              <div className="mt-4 rounded-md border border-emerald-400/40 bg-emerald-500/10 p-4">
                <p className="text-sm text-emerald-200">Your voucher code</p>
                <p className="mt-2 font-mono text-2xl font-bold text-emerald-100">{status.voucher}</p>
              </div>
            ) : (
              <button className="btn-secondary mt-4" type="button" onClick={() => checkPayment()} disabled={checking}>
                {checking ? "Checking..." : "Check again"}
              </button>
            )}
          </div>
        ) : null}

        <form onSubmit={submit} className="panel mt-6 p-5">
          {loading ? <p className="text-sm text-muted">Loading packages...</p> : null}

          {!loading && config && !config.configured ? (
            <p className="text-sm text-red-300">Pesapal is not configured on the backend.</p>
          ) : null}

          {!loading && activePlans.length === 0 ? (
            <p className="text-sm text-muted">No active packages are available.</p>
          ) : null}

          <div className="grid gap-3">
            {activePlans.map((plan) => (
              <label
                key={plan.id}
                className={`cursor-pointer rounded-md border p-4 transition ${
                  selectedPlanId === plan.id ? "border-brand bg-soft" : "border-line bg-panel"
                }`}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="plan"
                  value={plan.id}
                  checked={selectedPlanId === plan.id}
                  onChange={() => setSelectedPlanId(plan.id)}
                />
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block font-semibold">{plan.name}</span>
                    <span className="mt-1 block text-sm text-muted">
                      {formatDuration(plan.duration_minutes)} - {plan.download_speed} down
                    </span>
                  </span>
                  <span className="font-bold text-brand">
                    {config?.currency || "UGX"} {plan.price.toLocaleString()}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium">
              Phone
              <input
                className="field mt-2"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="2567XXXXXXXX"
              />
            </label>
            <label className="text-sm font-medium">
              Email
              <input
                className="field mt-2"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </label>
          </div>

          <button
            className="btn mt-5 w-full"
            type="submit"
            disabled={!config?.configured || !selectedPlan || submitting}
          >
            {submitting ? "Opening Pesapal..." : "Pay with Pesapal"}
          </button>
        </form>
      </div>
    </main>
  );
}

function formatDuration(minutes: number) {
  if (minutes >= 1440 && minutes % 1440 === 0) {
    const days = minutes / 1440;
    return days === 1 ? "1 day" : `${days} days`;
  }
  if (minutes >= 60 && minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  return `${minutes} minutes`;
}
