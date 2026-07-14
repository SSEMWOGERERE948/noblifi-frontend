"use client";

import { FormEvent, useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

type Voucher = { id: string; code: string; status: string; plan_id: string };
type Plan = { id: string; name: string; price: number; duration_minutes: number; download_speed: string; upload_speed: string };

export default function VouchersPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [planId, setPlanId] = useState("");
  const [quantity, setQuantity] = useState("10");
  const planById = new Map(plans.map((plan) => [plan.id, plan]));

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/plans`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data: Plan[]) => {
        setPlans(data);
        setPlanId(data[0]?.id ?? "");
      })
      .catch(() => setPlans([]));
    fetch(`${API_BASE_URL}/api/v1/vouchers`)
      .then((response) => (response.ok ? response.json() : []))
      .then(setVouchers)
      .catch(() => setVouchers([]));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`${API_BASE_URL}/api/v1/vouchers/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_id: planId, quantity: Number(quantity) })
    });
    if (response.ok) {
      const generated = (await response.json()) as Voucher[];
      setVouchers((current) => [...generated, ...current]);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Vouchers</h1>
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
        <button className="btn" type="submit" disabled={!planId}>
          Generate
        </button>
      </form>
      <div className="panel mt-6 divide-y divide-line">
        {vouchers.map((voucher) => (
          <div key={voucher.id} className="grid gap-3 p-4 text-sm md:grid-cols-4">
            <span className="font-mono font-semibold text-ink">{voucher.code}</span>
            <span className="text-muted">{planById.get(voucher.plan_id)?.name ?? voucher.plan_id}</span>
            <span className="text-muted">
              {planById.get(voucher.plan_id)
                ? `${planById.get(voucher.plan_id)?.duration_minutes} min - ${planById.get(voucher.plan_id)?.download_speed} down`
                : "Package details unavailable"}
            </span>
            <span className="text-muted">{voucher.status}</span>
          </div>
        ))}
        {vouchers.length === 0 && <div className="p-4 text-sm text-muted">No vouchers generated yet.</div>}
      </div>
    </div>
  );
}

