"use client";

import { FormEvent, useEffect, useState } from "react";
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
    <div>
      <h1 className="text-2xl font-semibold text-ink">Plans</h1>
      <form onSubmit={submit} className="panel mt-6 grid gap-4 p-5 md:grid-cols-3">
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
          <button className="btn" type="submit">
            Create plan
          </button>
        </div>
      </form>
      <div className="panel mt-6 divide-y divide-line">
        {plans.map((plan) => (
          <div key={plan.id} className="grid gap-3 p-4 text-sm md:grid-cols-6">
            <span className="font-medium text-ink">{plan.name}</span>
            <span className="text-muted">{plan.price}</span>
            <span className="text-muted">{plan.duration_minutes} min</span>
            <span className="text-muted">Up {plan.upload_speed}</span>
            <span className="text-muted">Down {plan.download_speed}</span>
            <span className="text-muted">{plan.max_devices} devices</span>
          </div>
        ))}
      </div>
    </div>
  );
}
