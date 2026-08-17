"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

type Plan = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
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

const trackingKey = "noblifi_iotec_tracking";

const subscriptionPlan: Plan = {
  id: "subscription",
  name: "NobliFi Monthly",
  price: 25000,
  duration_minutes: 30 * 24 * 60,
  is_active: true
};

export default function SubscriptionPaymentPage() {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activePlans = useMemo(() => [subscriptionPlan], []);
  const selectedPlan = activePlans.find((plan) => plan.id === selectedPlanId) ?? null;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const configResponse = await fetch(`${API_BASE_URL}/api/v1/payments/config`, { cache: "no-store" });
        const paymentConfig = (await configResponse.json().catch(() => null)) as PaymentConfig | null;
        if (cancelled) return;

        if (!configResponse.ok || !paymentConfig) {
          throw new Error((paymentConfig as { message?: string } | null)?.message || "Payment configuration could not be loaded.");
        }

        setConfig(paymentConfig);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load payment configuration.");
        }
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
        throw new Error(body?.message || body?.error || "Could not start ioTec collection.");
      }

      const order = body as StartOrderResponse;
      window.sessionStorage.setItem(trackingKey, order.order_tracking_id);
      setStatus({
        success: false,
        status: "pending",
        raw_status: "Approve the mobile money prompt on your phone.",
        merchant_reference: order.merchant_reference,
        order_tracking_id: order.order_tracking_id
      });
      setSubmitting(false);
      checkPayment(order.order_tracking_id, 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start ioTec collection.");
      setSubmitting(false);
    }
  }

  async function checkPayment(trackingId?: string, tries = 20) {
    const id = trackingId || window.sessionStorage.getItem(trackingKey);
    if (!id) {
      setError("No ioTec transaction ID was found for this checkout.");
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
      } else if (result.status !== "failed" && tries > 0) {
        window.setTimeout(() => checkPayment(id, tries - 1), 3000);
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
        <h1 className="text-2xl font-semibold">NobliFi Subscription</h1>
        <p className="mt-2 text-sm text-muted">Choose your subscription and complete the payment securely with ioTec Pay.</p>

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
            <p className="text-sm text-red-300">ioTec Pay is not configured on the backend.</p>
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
                  onChange={() => {
                    setSelectedPlanId(plan.id);
                    setError(null);
                    setStatus(null);
                  }}
                />
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block font-semibold">{plan.name}</span>
                    <span className="mt-1 block text-sm text-muted">
                      {formatDuration(plan.duration_minutes)}
                    </span>
                  </span>
                  <span className="font-bold text-brand">
                    {config?.currency || "UGX"} {plan.price.toLocaleString()}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {selectedPlanId && (
            <>
              <div className="mt-6 border-t border-line pt-6">
                <p className="text-sm font-semibold">Payment Details</p>
                <p className="mt-1 text-xs text-muted">Enter your contact information for ioTec payment processing</p>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium">
                  Phone
                  <input
                    className="field mt-2"
                    required
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="0111777777"
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
            </>
          )}

          <button
            className="btn mt-5 w-full"
            type="submit"
            disabled={!config?.configured || !selectedPlan || submitting}
          >
            {submitting ? "Processing payment..." : "Pay with ioTec"}
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
