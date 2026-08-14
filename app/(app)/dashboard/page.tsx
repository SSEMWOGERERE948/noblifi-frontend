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
      <OperationsTitle title="Account dashboard" description="Live overview from the NobliFi API." />
      {error ? <p className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</p> : null}
      {loading ? <p className="text-sm text-muted">Loading dashboard...</p> : null}
      {!loading && !error ? (
        <>
          <MetricGrid
            metrics={[
              { label: "Routers", value: String(routers.length), detail: `${onlineRouters} online or linked`, icon: "R" },
              { label: "Plans", value: String(plans.length), detail: "Hotspot plans", icon: "P" },
              { label: "Vouchers", value: String(vouchers.length), detail: `${unusedVouchers} unused`, icon: "V" },
              { label: "Active services", value: String(routers.length + plans.length + vouchers.length), detail: "Records in API", icon: "A" }
            ]}
          />
          <section className="mt-5">
            <h2 className="mb-3 text-lg font-semibold text-ink">Recent routers</h2>
            {routers.length ? (
              <DataTable
                columns={["Router", "Site", "Status"]}
                rows={routers.slice(0, 5).map((router) => ({
                  Router: router.name,
                  Site: router.site_name ?? "-",
                  Status: <StatusBadge label={router.status || "Pending"} />
                }))}
              />
            ) : (
              <EmptyState title="No routers yet" description="Add a router to begin provisioning MikroTik devices." />
            )}
          </section>
        </>
      ) : null}
    </>
  );
}
