"use client";

import { FormEvent, useEffect, useState } from "react";
import { DataTable, EmptyState, OperationsTitle, StatusBadge } from "@/components/OperationsUI";
import { apiFetch } from "@/lib/api";

type Voucher = { id: string; code: string; status: string; plan_id: string };
type Plan = { id: string; name: string };

export default function VouchersPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [planId, setPlanId] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [loading, setLoading] = useState(true);

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
    const generated = await apiFetch<Voucher[]>("/api/v1/vouchers/generate", {
      method: "POST",
      body: JSON.stringify({ plan_id: planId, quantity: Number(quantity) })
    });
    setVouchers((current) => [...generated, ...current]);
  }

  return (
    <>
      <OperationsTitle title="Vouchers" description="Generate and manage real voucher records from the API." action={<button className="btn" type="submit" form="voucher-form">Generate vouchers</button>} />
      <form id="voucher-form" onSubmit={submit} className="panel flex flex-col gap-4 p-5 md:flex-row md:items-end">
        <label className="flex-1 text-sm font-medium text-ink">
          Plan
          <select className="field mt-2" value={planId} onChange={(event) => setPlanId(event.target.value)}>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>{plan.name}</option>
            ))}
          </select>
        </label>
        <label className="w-full text-sm font-medium text-ink md:w-48">
          Quantity
          <input className="field mt-2" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
        </label>
        <button className="btn" type="submit" disabled={!planId}>Generate</button>
      </form>
      <section className="mt-5">
        <h2 className="mb-3 text-lg font-semibold text-ink">Current vouchers</h2>
        {loading ? <p className="text-sm text-muted">Loading vouchers...</p> : null}
        {!loading && vouchers.length ? (
          <DataTable
            columns={["Code", "Plan ID", "Status"]}
            rows={vouchers.map((voucher) => ({
              Code: <span className="font-mono font-semibold text-ink">{voucher.code}</span>,
              "Plan ID": voucher.plan_id,
              Status: <StatusBadge label={voucher.status} />
            }))}
          />
        ) : null}
        {!loading && !vouchers.length ? <EmptyState title="No vouchers yet" description="Generate a voucher batch after creating a plan." /> : null}
      </section>
    </>
  );
}
