"use client";

import { FormEvent, useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

type Voucher = { id: string; code: string; status: string; plan_id: string };
type Plan = { id: string; name: string };

export default function VouchersPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [planId, setPlanId] = useState("");
  const [quantity, setQuantity] = useState("10");

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
          Plan
          <select className="field mt-2" value={planId} onChange={(e) => setPlanId(e.target.value)}>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
        </label>
        <label className="w-full text-sm font-medium text-ink md:w-48">
          Quantity
          <input className="field mt-2" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </label>
        <button className="btn" type="submit">
          Generate
        </button>
      </form>
      <div className="panel mt-6 divide-y divide-line">
        {vouchers.map((voucher) => (
          <div key={voucher.id} className="grid gap-3 p-4 text-sm md:grid-cols-3">
            <span className="font-mono font-semibold text-ink">{voucher.code}</span>
            <span className="text-muted">{voucher.status}</span>
            <span className="text-muted">{voucher.plan_id}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

