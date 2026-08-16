"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, EmptyState, OperationsTitle, StatusBadge } from "@/components/OperationsUI";
import { apiFetch } from "@/lib/api";

type Voucher = {
  id: string;
  code: string;
  status: string;
  plan_id: string;
  channel?: string;
  batch_id?: string | null;
  template?: string | null;
  pattern?: string | null;
};
type Plan = { id: string; name: string };

const templates = [
  { value: "compact", label: "Compact cards", detail: "Small counter cards with plan, code, and duration." },
  { value: "receipt", label: "Receipt slips", detail: "Narrow receipt layout for POS printers." },
  { value: "scratch_card", label: "Scratch cards", detail: "Larger card layout for covered voucher codes." }
];

const patterns = [
  { value: "alphanumeric", label: "NF-8Q2K7A" },
  { value: "numeric", label: "NF-12345678" },
  { value: "segmented", label: "NF-ABCD-1234" }
];

export default function VouchersPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [planId, setPlanId] = useState("");
  const [quantity, setQuantity] = useState("500");
  const [template, setTemplate] = useState("compact");
  const [pattern, setPattern] = useState("alphanumeric");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<Plan[]>("/api/v1/plans", { fallback: [] }),
      apiFetch<Voucher[]>("/api/v1/vouchers", { fallback: [] })
    ])
      .then(([planData, voucherData]: [Plan[], Voucher[]]) => {
        setPlans(planData);
        setPlanId(planData[0]?.id ?? "");
        setVouchers(voucherData);
      })
      .catch(() => {
        setPlans([]);
        setVouchers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    try {
      const generated = await apiFetch<Voucher[]>("/api/v1/vouchers/generate", {
        method: "POST",
        body: JSON.stringify({ plan_id: planId, quantity: Number(quantity), template, pattern })
      });
      setVouchers((current) => [...generated, ...current]);
    } catch (error) {
      const fallbackMessage = "Your free trial has expired. Please subscribe to continue.";
      const nextMessage = error instanceof Error ? error.message : fallbackMessage;
      setMessage(nextMessage);
    }
  }

  return (
    <>
      <OperationsTitle title="Vouchers" description="Mobile money online vouchers are generated automatically when a package is created. Use this page to create printable physical voucher batches." action={<button className="btn" type="submit" form="voucher-form">Generate physical vouchers</button>} />
      {message ? (
        <div className="mb-5 rounded-md border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-200">Subscription required</p>
          <p className="mt-2 text-sm text-amber-100/90">{message}</p>
          <button type="button" className="btn mt-4" onClick={() => router.push("/subscriptions")}>Go to subscriptions</button>
        </div>
      ) : null}
      <form id="voucher-form" onSubmit={submit} className="panel grid gap-5 p-5">
        <div className="grid gap-4 md:grid-cols-3">
          {templates.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTemplate(option.value)}
              className={`rounded-lg border p-4 text-left transition ${template === option.value ? "border-accent bg-emerald-400/10" : "border-line bg-panel hover:bg-soft"}`}
            >
              <div className="mb-4 rounded-md border border-line bg-app p-3">
                <div className="text-xs uppercase text-muted">NobliFi WiFi</div>
                <div className="mt-2 font-mono text-lg font-semibold text-ink">{patterns.find((item) => item.value === pattern)?.label}</div>
                <div className="mt-2 text-xs text-muted">{option.label}</div>
              </div>
              <h2 className="font-semibold text-ink">{option.label}</h2>
              <p className="mt-1 text-xs text-muted">{option.detail}</p>
            </button>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-4">
        <label className="text-sm font-medium text-ink md:col-span-2">
          Plan
          <select className="field mt-2" value={planId} onChange={(event) => setPlanId(event.target.value)}>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>{plan.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-ink">
          Code pattern
          <select className="field mt-2" value={pattern} onChange={(event) => setPattern(event.target.value)}>
            {patterns.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-ink">
          Tokens
          <input className="field mt-2" type="number" min="1" max="500" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
        </label>
        </div>
        <div>
          <p className="mb-3 text-xs text-muted">Physical voucher batches are capped at 500 tokens.</p>
          <button className="btn" type="submit" disabled={!planId}>Generate physical batch</button>
        </div>
      </form>
      <section className="mt-5">
        <h2 className="mb-3 text-lg font-semibold text-ink">Current vouchers</h2>
        {loading ? <p className="text-sm text-muted">Loading vouchers...</p> : null}
        {!loading && vouchers.length ? (
          <DataTable
            columns={["Code", "Plan ID", "Channel", "Template", "Pattern", "Batch", "Status"]}
            rows={vouchers.map((voucher) => ({
              Code: <span className="font-mono font-semibold text-ink">{voucher.code}</span>,
              "Plan ID": voucher.plan_id,
              Channel: voucher.channel ?? "physical",
              Template: voucher.template ?? "-",
              Pattern: voucher.pattern ?? "-",
              Batch: voucher.batch_id ?? "-",
              Status: <StatusBadge label={voucher.status} />
            }))}
          />
        ) : null}
        {!loading && !vouchers.length ? <EmptyState title="No vouchers yet" description="Generate a voucher batch after creating a plan." /> : null}
      </section>
    </>
  );
}
