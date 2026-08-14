"use client";

import { FormEvent, useEffect, useState } from "react";
import { MetricGrid, OperationsTitle, RecentPanel, StatusBadge, TrendPanel } from "@/components/OperationsUI";
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
    <>
      <OperationsTitle title="Vouchers" description="Manage voucher batches, pricing plans, redemptions, and inventory in real time." action={<button className="btn" type="submit" form="voucher-form">Generate vouchers</button>} />
      <MetricGrid
        metrics={[
          { label: "Active vouchers", value: "128,540", change: "12.6%", detail: "Across all plans", icon: "V" },
          { label: "Redeemed today", value: "8,642", change: "8.3%", detail: "vs yesterday", icon: "R" },
          { label: "Expired vouchers", value: "1,245", change: "6.7%", detail: "vs last period", negative: true, icon: "E" },
          { label: "Voucher revenue", value: "UGX 21,840,000", change: "14.2%", detail: "From voucher sales", icon: "S" }
        ]}
      />
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_1fr]">
        <TrendPanel
          title="Voucher redemption trend"
          description="Number of vouchers redeemed over time."
          points={[
            { label: "Aug 1", value: 3700, display: "3.7K" },
            { label: "Aug 2", value: 5100, display: "5.1K" },
            { label: "Aug 3", value: 7200, display: "7.2K" },
            { label: "Aug 4", value: 6000, display: "6.0K" },
            { label: "Aug 5", value: 8600, display: "8.6K" }
          ]}
        />
        <RecentPanel title="Recent voucher sales" items={[
          { title: "24 Hours Plan", subtitle: "Batch: VCH-20260805-001", meta: "10:24 AM", value: "+UGX 120,000" },
          { title: "7 Days Plan", subtitle: "Batch: VCH-20260805-002", meta: "09:41 AM", value: "+UGX 280,000" },
          { title: "30 Days Plan", subtitle: "Batch: VCH-20260804-004", meta: "Yesterday", value: "+UGX 450,000" }
        ]} />
      </div>
      <form id="voucher-form" onSubmit={submit} className="panel mt-5 flex flex-col gap-4 p-5 md:flex-row md:items-end">
        <label className="flex-1 text-sm font-medium text-ink">
          Plan
          <select className="field mt-2" value={planId} onChange={(e) => setPlanId(e.target.value)}>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>{plan.name}</option>
            ))}
          </select>
        </label>
        <label className="w-full text-sm font-medium text-ink md:w-48">
          Quantity
          <input className="field mt-2" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </label>
        <button className="btn" type="submit">Generate</button>
      </form>
      <div className="panel mt-5 overflow-hidden">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line bg-soft/60 text-xs uppercase text-muted">
            <tr><th className="px-4 py-3">Code</th><th>Plan ID</th><th>Status</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {vouchers.map((voucher) => (
              <tr key={voucher.id}>
                <td className="px-4 py-3 font-mono font-semibold text-ink">{voucher.code}</td>
                <td className="px-4 py-3 text-muted">{voucher.plan_id}</td>
                <td className="px-4 py-3"><StatusBadge label={voucher.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!vouchers.length ? <p className="p-5 text-sm text-muted">No vouchers returned yet. Generate a batch after creating a hotspot plan.</p> : null}
      </div>
    </>
  );
}
