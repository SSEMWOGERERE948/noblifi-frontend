"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { apiFetch } from "@/lib/api";
import { formatUsageBytes } from "@/lib/receipt";

type RouterRow = { id: string; name: string; status: string; site_name?: string };
type Plan = { id: string; name: string; price: number; duration_minutes: number; max_devices: number };
type Voucher = { id: string; code: string; status: string; plan_id: string };
type RevenueSummary = { currency: string; month_revenue: number; today_revenue: number; successful_payments: number };
type SalesSummary = { currency: string; gross_sales: number; platform_fees: number; merchant_net: number; physical_sales: number };
type WalletSummary = { currency: string; available: number; pending_withdrawals: number };

type StatsSummary = {
  routers: { total: number; online: number };
  users: { total: number; active_sessions: number };
  data_usage: { upload_bytes: number; download_bytes: number; total_bytes: number };
  router_cpu_usage?: unknown;
};

export default function DashboardPage() {
  const [routers, setRouters] = useState<RouterRow[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [sales, setSales] = useState<SalesSummary | null>(null);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<RouterRow[]>("/api/v1/routers"),
      apiFetch<Plan[]>("/api/v1/plans", { fallback: [] }),
      apiFetch<Voucher[]>("/api/v1/vouchers", { fallback: [] }),
      apiFetch<RevenueSummary>("/api/v1/revenue/summary", {
        fallback: { currency: "UGX", month_revenue: 0, today_revenue: 0, successful_payments: 0 }
      }),
      apiFetch<SalesSummary>("/api/v1/sales/summary", {
        fallback: { currency: "UGX", gross_sales: 0, platform_fees: 0, merchant_net: 0, physical_sales: 0 }
      }),
      apiFetch<WalletSummary>("/api/v1/wallet", {
        fallback: { currency: "UGX", available: 0, pending_withdrawals: 0 }
      }),
      apiFetch<StatsSummary>("/api/v1/dashboard/stats", {
        fallback: {
          routers: { total: 0, online: 0 },
          users: { total: 0, active_sessions: 0 },
          data_usage: { upload_bytes: 0, download_bytes: 0, total_bytes: 0 }
        }
      })
    ])
      .then(([routerData, planData, voucherData, revenueData, salesData, walletData, statsData]) => {
        setRouters(routerData);
        setPlans(planData);
        setVouchers(voucherData);
        setRevenue(revenueData);
        setSales(salesData);
        setWallet(walletData);
        setStats(statsData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const onlineRouters = routers.filter((router) => ["online", "linked", "provisioned"].includes(router.status?.toLowerCase())).length;
  const unusedVouchers = vouchers.filter((voucher) => voucher.status?.toLowerCase() === "unused").length;
  const activePlans = plans.filter((plan) => plan?.duration_minutes > 0).length;

  const statsCards = [
    { label: "Online routers", value: String(onlineRouters) },
    { label: "Active plans", value: String(activePlans) },
    { label: "Unused vouchers", value: String(unusedVouchers) },
    { label: "Total routers", value: String(routers.length) }
  ];

  const usageCards = [
    { label: "Upload", value: formatUsageBytes(stats?.data_usage?.upload_bytes ?? 0) },
    { label: "Download", value: formatUsageBytes(stats?.data_usage?.download_bytes ?? 0) },
    { label: "Total traffic", value: formatUsageBytes(stats?.data_usage?.total_bytes ?? 0) },
    { label: "Active sessions", value: String(stats?.users?.active_sessions ?? 0) }
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="Operational overview for hotspot billing and router provisioning." />
      {error ? <div className="panel mb-4 p-4 text-sm text-red-600">{error}</div> : null}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="panel h-28 animate-pulse p-5">
                <div className="h-4 w-20 rounded bg-slate-200/70" />
                <div className="mt-5 h-9 w-16 rounded bg-slate-200/70" />
              </div>
            ))
          : statsCards.map((stat) => (
              <div key={stat.label} className="panel p-5">
                <p className="text-sm font-medium text-muted">{stat.label}</p>
                <p className="mt-3 text-3xl font-semibold text-ink">{stat.value}</p>
              </div>
            ))}
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {usageCards.map((stat) => (
          <div key={stat.label} className="panel p-5">
            <p className="text-sm font-medium text-muted">{stat.label}</p>
            <p className="mt-3 text-2xl font-semibold text-ink">{stat.value}</p>
          </div>
        ))}
      </section>
      <section className="panel mt-5 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted">Net Sales</p>
            <p className="mt-2 text-3xl font-semibold text-ink">
              {formatMoney(sales?.merchant_net ?? 0, sales?.currency ?? "UGX")}
            </p>
            <p className="mt-2 text-sm text-muted">
              Mobile money gross: {formatMoney(revenue?.month_revenue ?? 0, revenue?.currency ?? "UGX")} - Physical: {formatMoney(sales?.physical_sales ?? 0, sales?.currency ?? "UGX")} - Fees: {formatMoney(sales?.platform_fees ?? 0, sales?.currency ?? "UGX")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn-secondary" href="/wallet">Wallet {formatMoney(wallet?.available ?? 0, wallet?.currency ?? "UGX")}</Link>
            <Link className="btn" href="/sales">View Sales</Link>
          </div>
        </div>
      </section>
    </>
  );
}

function formatMoney(value: number, currency: string) {
  return `${currency} ${new Intl.NumberFormat("en-UG").format(value || 0)}`;
}

