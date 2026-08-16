"use client";

import { useEffect, useState } from "react";
import { DataTable, EmptyState, MetricGrid, OperationsTitle, StatusBadge } from "@/components/OperationsUI";
import { apiFetch } from "@/lib/api";

type RouterRow = { id: string; name: string; status: string; site_name?: string };
type Plan = { id: string; name: string; price: number; duration_minutes: number; max_devices: number };
type Voucher = { id: string; code: string; status: string; plan_id: string };

export default function DashboardPage() {
  const [routers, setRouters] = useState<RouterRow[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<RouterRow[]>("/api/v1/routers"),
      apiFetch<Plan[]>("/api/v1/plans", { fallback: [] }),
      apiFetch<Voucher[]>("/api/v1/vouchers", { fallback: [] })
    ])
      .then(([routerData, planData, voucherData]) => {
        setRouters(routerData);
        setPlans(planData);
        setVouchers(voucherData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const onlineRouters = routers.filter((router) => ["online", "linked", "provisioned"].includes(router.status?.toLowerCase())).length;
  const unusedVouchers = vouchers.filter((voucher) => voucher.status?.toLowerCase() === "unused").length;

  return (
    <>
      <PageHeader title="Dashboard" description="Operational overview for hotspot billing and router provisioning." />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="panel p-5">
            <p className="text-sm font-medium text-muted">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{stat.value}</p>
          </div>
        ))}
      </section>
    </>
  );
}

