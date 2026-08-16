"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, EmptyState, OperationsTitle, StatusBadge } from "@/components/OperationsUI";
import { apiFetch } from "@/lib/api";

type Plan = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  upload_speed: string;
  download_speed: string;
  max_devices: number;
  online_vouchers_created?: number;
};

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState({ name: "", price: "100", duration_minutes: "60", upload_speed: "5M", download_speed: "10M", max_devices: "1" });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiFetch<Plan[]>("/api/v1/plans", { fallback: [] })
      .then(setPlans)
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    try {
      const created = await apiFetch<Plan>("/api/v1/plans", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          duration_minutes: Number(form.duration_minutes),
          max_devices: Number(form.max_devices)
        })
      });
      setPlans((current) => [...current, created]);
      setForm({ ...form, name: "" });
      setMessage(`Plan created. ${created.online_vouchers_created ?? 0} mobile money online vouchers were generated automatically.`);
    } catch (error) {
      const fallbackMessage = "Your free trial has expired. Please subscribe to continue.";
      const nextMessage = error instanceof Error ? error.message : fallbackMessage;
      setMessage(nextMessage);
    }
  }

  return (
    <>
      <OperationsTitle title="Plans" description="Create and manage real hotspot voucher plans from the API." />
      {message ? (
        <div className="mb-5 rounded-md border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-200">Subscription required</p>
          <p className="mt-2 text-sm text-amber-100/90">{message}</p>
          <button type="button" className="btn mt-4" onClick={() => router.push("/subscriptions")}>Go to subscriptions</button>
        </div>
      ) : null}
      <form onSubmit={submit} className="panel grid gap-4 p-5 md:grid-cols-3">
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
            <input className="field mt-2" value={form[key as keyof typeof form]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} required />
          </label>
        ))}
        <div className="md:col-span-3">
          <button className="btn" type="submit">Create plan</button>
        </div>
      </form>
      {message ? <p className="mt-4 rounded-md border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-accent">{message}</p> : null}
      <section className="mt-5">
        <h2 className="mb-3 text-lg font-semibold text-ink">Current plans</h2>
        {loading ? <p className="text-sm text-muted">Loading plans...</p> : null}
        {!loading && plans.length ? (
          <DataTable
            columns={["Name", "Price", "Duration", "Upload", "Download", "Devices", "Status"]}
            rows={plans.map((plan) => ({
              Name: plan.name,
              Price: plan.price,
              Duration: `${plan.duration_minutes} min`,
              Upload: plan.upload_speed,
              Download: plan.download_speed,
              Devices: plan.max_devices,
              Status: <StatusBadge label="Active" />
            }))}
          />
        ) : null}
        {!loading && !plans.length ? <EmptyState title="No plans yet" description="Create a hotspot voucher plan to make it available for voucher generation." /> : null}
      </section>
    </>
  );
}
