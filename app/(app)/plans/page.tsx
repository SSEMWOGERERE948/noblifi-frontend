"use client";

import { FormEvent, useEffect, useState } from "react";
import { OperationsTitle, StatusBadge } from "@/components/OperationsUI";
import { API_BASE_URL } from "@/lib/api";

type Plan = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  upload_speed: string;
  download_speed: string;
  max_devices: number;
};

const subscriptionPlans = [
  { name: "Starter", price: "UGX 150,000", subtitle: "Perfect for small hotspots", features: ["Up to 3 routers", "5,000 vouchers / month", "2 admin users", "Basic reports", "Email support"] },
  { name: "Growth", price: "UGX 450,000", subtitle: "Built for growing businesses", popular: true, features: ["Up to 10 routers", "25,000 vouchers / month", "5 admin users", "Advanced analytics", "Remote access", "Priority support"] },
  { name: "Enterprise", price: "Custom pricing", subtitle: "For unlimited or high-scale operations", features: ["Unlimited routers", "Unlimited vouchers", "Unlimited users", "API access", "Dedicated account manager"] }
];

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState({ name: "", price: "100", duration_minutes: "60", upload_speed: "5M", download_speed: "10M", max_devices: "1" });

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/plans`)
      .then((response) => (response.ok ? response.json() : []))
      .then(setPlans)
      .catch(() => setPlans([]));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`${API_BASE_URL}/api/v1/plans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
        duration_minutes: Number(form.duration_minutes),
        max_devices: Number(form.max_devices)
      })
    });
    if (response.ok) {
      const created = (await response.json()) as Plan;
      setPlans((current) => [...current, created]);
      setForm({ ...form, name: "" });
    }
  }

  return (
    <>
      <OperationsTitle title="Plans & Pricing" description="Choose the right subscription after your 30-day free trial." action={<button className="btn" type="button">Upgrade now</button>} />
      <section className="panel mb-5 flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink">18 days left in your free trial</h2>
          <p className="mt-1 text-sm text-muted">Upgrade before the trial ends to keep your routers, vouchers, and reports active without interruption.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary" type="button">Compare plans</button>
          <button className="btn" type="button">Contact sales</button>
        </div>
      </section>
      <section className="grid gap-5 lg:grid-cols-3">
        {subscriptionPlans.map((plan) => (
          <article key={plan.name} className={`panel relative p-6 ${plan.popular ? "border-accent" : ""}`}>
            {plan.popular ? <div className="absolute left-0 right-0 top-0 mx-auto w-40 rounded-b-md bg-emerald-400/20 py-1 text-center text-xs font-bold uppercase text-accent">Most popular</div> : null}
            <h2 className="text-xl font-semibold text-ink">{plan.name}</h2>
            <p className="mt-1 text-sm text-muted">{plan.subtitle}</p>
            <p className="mt-5 text-3xl font-semibold text-accent">{plan.price}<span className="text-sm font-normal text-muted">{plan.price.startsWith("UGX") ? " / month" : ""}</span></p>
            <ul className="mt-5 space-y-2 text-sm text-muted">
              {plan.features.map((feature) => <li key={feature}>+ {feature}</li>)}
            </ul>
            <button className={plan.popular ? "btn mt-8 w-full" : "btn-secondary mt-8 w-full"} type="button">{plan.name === "Enterprise" ? "Talk to sales" : `Choose ${plan.name}`}</button>
          </article>
        ))}
      </section>
      <section className="panel mt-5 overflow-hidden">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line bg-soft/60 text-xs uppercase text-muted">
            <tr><th className="px-4 py-3">Features</th><th>Starter</th><th>Growth</th><th>Enterprise</th></tr>
          </thead>
          <tbody className="divide-y divide-line text-muted">
            {[
              ["Routers", "Up to 3", "Up to 10", "Unlimited"],
              ["Voucher volume / month", "5,000", "25,000", "Unlimited"],
              ["Users", "2", "5", "Unlimited"],
              ["Analytics", "Basic reports", "Advanced analytics", "Advanced analytics & insights"],
              ["Remote Access", "-", "+", "+"],
              ["Support", "Email support", "Priority support", "Dedicated account manager"]
            ].map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell} className="px-4 py-3">{cell}</td>)}</tr>)}
          </tbody>
        </table>
      </section>
      <form onSubmit={submit} className="panel mt-5 grid gap-4 p-5 md:grid-cols-3">
        <div className="md:col-span-3">
          <h2 className="text-lg font-semibold text-ink">Hotspot voucher plans</h2>
          <p className="mt-1 text-sm text-muted">These API-backed plans are used when generating vouchers.</p>
        </div>
        {[
          ["name", "Name"],
          ["price", "Price"],
          ["duration_minutes", "Duration minutes"],
          ["upload_speed", "Upload speed"],
          ["download_speed", "Download speed"],
          ["max_devices", "Max devices"]
        ].map(([key, label]) => (
          <label key={key} className="text-sm font-medium text-ink">
            {label}
            <input className="field mt-2" value={form[key as keyof typeof form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required />
          </label>
        ))}
        <div className="md:col-span-3">
          <button className="btn" type="submit">Create hotspot plan</button>
        </div>
      </form>
      <div className="panel mt-5 divide-y divide-line">
        {plans.map((plan) => (
          <div key={plan.id} className="grid gap-3 p-4 text-sm md:grid-cols-7">
            <span className="font-medium text-ink">{plan.name}</span>
            <span className="text-muted">{plan.price}</span>
            <span className="text-muted">{plan.duration_minutes} min</span>
            <span className="text-muted">Up {plan.upload_speed}</span>
            <span className="text-muted">Down {plan.download_speed}</span>
            <span className="text-muted">{plan.max_devices} devices</span>
            <StatusBadge label="Active" />
          </div>
        ))}
      </div>
    </>
  );
}
