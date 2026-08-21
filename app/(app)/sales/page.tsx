"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable, EmptyState, OperationsTitle, StatusBadge } from "@/components/OperationsUI";
import { apiFetch } from "@/lib/api";

type RevenueSummary = {
  currency: string;
  total_revenue: number;
  today_revenue: number;
  week_revenue: number;
  month_revenue: number;
  successful_payments: number;
  pending_payments: number;
  failed_payments: number;
  pending_value: number;
};

type BreakdownRow = { id: string; name: string; sales: number; revenue: number; currency: string };
type TrendPoint = { label: string; revenue: number; purchases: number };
type Transaction = {
  transaction_id: string;
  customer: string;
  phone: string;
  hotspot: string;
  package: string;
  amount: number;
  currency: string;
  provider: string;
  payment_status: string;
  voucher: string;
  device: string;
  created_at: string;
  paid_at?: string;
};
type SalesSummary = { currency: string; gross_sales: number; platform_fees: number; merchant_net: number; physical_sales: number };
type Sale = {
  id: string;
  source: string;
  payment_reference: string;
  customer_name: string;
  phone: string;
  gross_amount: number;
  platform_fee_amount: number;
  merchant_net_amount: number;
  currency: string;
  payment_status: string;
  sold_at: string;
};

const emptySummary: RevenueSummary = {
  currency: "UGX",
  total_revenue: 0,
  today_revenue: 0,
  week_revenue: 0,
  month_revenue: 0,
  successful_payments: 0,
  pending_payments: 0,
  failed_payments: 0,
  pending_value: 0
};

export default function SalesPage() {
  const [summary, setSummary] = useState<RevenueSummary>(emptySummary);
  const [hotspots, setHotspots] = useState<BreakdownRow[]>([]);
  const [packages, setPackages] = useState<BreakdownRow[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [range, setRange] = useState("7d");
  const [routerID, setRouterID] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("router_id") ?? "";
  });
  const [provider, setProvider] = useState("");
  const [status, setStatus] = useState("");
  const [salesSearch, setSalesSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (range) params.set("range", range);
    if (routerID) params.set("router_id", routerID);
    if (provider) params.set("provider", provider);
    if (status) params.set("status", status);
    const query = params.toString() ? `?${params.toString()}` : "";

    setLoading(true);
    Promise.all([
      apiFetch<RevenueSummary>(`/api/v1/revenue/summary${query}`, { fallback: emptySummary }),
      apiFetch<BreakdownRow[]>(`/api/v1/revenue/by-hotspot${query}`, { fallback: [] }),
      apiFetch<BreakdownRow[]>(`/api/v1/revenue/by-package${query}`, { fallback: [] }),
      apiFetch<TrendPoint[]>(`/api/v1/revenue/trend${query}`, { fallback: [] }),
      apiFetch<Transaction[]>(`/api/v1/revenue/transactions${query ? `${query}&limit=100` : "?limit=100"}`, { fallback: [] }),
      apiFetch<SalesSummary>("/api/v1/sales/summary", { fallback: { currency: "UGX", gross_sales: 0, platform_fees: 0, merchant_net: 0, physical_sales: 0 } }),
      apiFetch<Sale[]>("/api/v1/sales?limit=100", { fallback: [] })
    ])
      .then(([summaryData, hotspotData, packageData, trendData, transactionData, salesSummaryData, salesData]) => {
        setSummary(normalizeRevenueSummary(summaryData));
        setHotspots(asArray(hotspotData));
        setPackages(asArray(packageData));
        setTrend(asArray(trendData));
        setTransactions(asArray(transactionData));
        setSalesSummary(normalizeSalesSummary(salesSummaryData));
        setSales(asArray(salesData));
        setError("");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load revenue."))
      .finally(() => setLoading(false));
  }, [range, routerID, provider, status]);

  const maxTrend = Math.max(...trend.map((point) => safeNumber(point.revenue)), 1);
  const providers = useMemo(() => Array.from(new Set(transactions.map((item) => safeString(item.provider)).filter(Boolean))), [transactions]);
  const filteredSales = useMemo(
    () =>
      sales.filter((item) =>
        saleSearchText(item).includes(
          salesSearch.trim().toLowerCase()
        )
      ),
    [sales, salesSearch]
  );
  const filteredTransactions = useMemo(
    () =>
      transactions.filter((item) =>
        transactionSearchText(item).includes(
          salesSearch.trim().toLowerCase()
        )
      ),
    [transactions, salesSearch]
  );
  const cards = [
    ["Total Online Revenue", money(summary.total_revenue, summary.currency), "Gross online revenue from paid HotSpot purchases"],
    ["Revenue Today", money(summary.today_revenue, summary.currency), "Confirmed paid today"],
    ["Revenue This Week", money(summary.week_revenue, summary.currency), "Confirmed paid this week"],
    ["Revenue This Month", money(summary.month_revenue, summary.currency), "Confirmed paid this month"],
    ["Successful Payments", String(safeNumber(summary.successful_payments)), "Paid transactions only"],
    ["Pending Payments", String(safeNumber(summary.pending_payments)), `Pending value ${money(summary.pending_value, summary.currency)}`]
  ];

  return (
    <>
      <OperationsTitle title="Revenue" description="Track gross online revenue from paid HotSpot package purchases." />
      <section className="mb-5 grid gap-4 md:grid-cols-4">
        <Metric label="Net Sales" value={money(salesSummary?.merchant_net ?? 0, salesSummary?.currency ?? "UGX")} />
        <Metric label="Mobile Money Gross" value={money(summary.total_revenue, summary.currency)} />
        <Metric label="Physical Sales" value={money(salesSummary?.physical_sales ?? 0, salesSummary?.currency ?? "UGX")} />
        <Metric label="NobliFi Fees" value={money(salesSummary?.platform_fees ?? 0, salesSummary?.currency ?? "UGX")} />
      </section>
      <section className="mb-5 grid gap-3 md:grid-cols-4">
        <select className="field" value={range} onChange={(event) => setRange(event.target.value)}>
          <option value="today">Today</option>
          <option value="7d">7 Days</option>
          <option value="30 days">30 Days</option>
          <option value="this_month">This Month</option>
          <option value="3 months">3 Months</option>
          <option value="6 months">6 Months</option>
          <option value="this_year">This Year</option>
        </select>
        <select className="field" value={routerID} onChange={(event) => setRouterID(event.target.value)}>
          <option value="">All HotSpots</option>
          {hotspots.map((hotspot, index) => (
            <option key={safeString(hotspot.id) || `hotspot-${index}`} value={safeString(hotspot.id)}>{safeString(hotspot.name) || "Unnamed HotSpot"}</option>
          ))}
        </select>
        <select className="field" value={provider} onChange={(event) => setProvider(event.target.value)}>
          <option value="">All Providers</option>
          {providers.map((item) => (
            <option key={item} value={item}>{titleCase(item)}</option>
          ))}
        </select>
        <select className="field" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All Payment Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </section>

      <section className="mb-5">
        <input
          className="field"
          value={salesSearch}
          onChange={(event) =>
            setSalesSearch(event.target.value)
          }
          placeholder="Search sales by transaction ID, customer, phone, package, voucher..."
        />
      </section>

      {error ? <div className="panel mb-4 p-4 text-sm text-red-400">{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value, detail]) => (
          <div key={label} className="panel min-h-32 p-5">
            <p className="text-sm font-medium text-muted">{label}</p>
            <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
            <p className="mt-2 text-xs text-muted">{detail}</p>
          </div>
        ))}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <div className="panel p-5">
          <h2 className="text-lg font-semibold text-ink">Revenue Trend</h2>
          <div className="mt-5 flex h-64 items-end gap-3 border-b border-line pb-5">
            {trend.length ? trend.map((point) => (
              <div key={point.label} className="flex h-full min-w-8 flex-1 flex-col justify-end">
                <span className="mb-2 text-center text-[11px] text-muted">{shortMoney(safeNumber(point.revenue))}</span>
                <div className="min-h-2 rounded-t-md bg-accent" style={{ height: `${Math.max(4, (safeNumber(point.revenue) / maxTrend) * 88)}%` }} />
                <span className="mt-2 truncate text-center text-[11px] text-muted">{safeString(point.label) || "-"}</span>
              </div>
            )) : <p className="self-center text-sm text-muted">No paid sales in this range.</p>}
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="text-lg font-semibold text-ink">Payment Status</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            {[
              ["Successful", summary.successful_payments],
              ["Pending", summary.pending_payments],
              ["Failed", summary.failed_payments]
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-line pb-2">
                <dt className="text-muted">{label}</dt>
                <dd className="font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Breakdown title="Revenue by HotSpot" rows={hotspots} onSelect={(id) => setRouterID(id)} />
        <Breakdown title="Revenue by Package" rows={packages} />
      </section>

      <section className="mt-5">
        <h2 className="mb-3 text-lg font-semibold text-ink">Sales Ledger</h2>
        {filteredSales.length ? (
          <DataTable
            columns={["Customer", "Transaction ID", "Source", "Gross", "NobliFi Fee", "Merchant Net", "Status", "Date"]}
            rows={filteredSales.map((item) => ({
              Customer: safeString(item.customer_name) || "-",
              "Transaction ID": safeString(item.payment_reference) || "-",
              Source: titleCase(safeString(item.source).replace(/_/g, " ")),
              Gross: money(item.gross_amount, item.currency),
              "NobliFi Fee": money(item.platform_fee_amount, item.currency),
              "Merchant Net": money(item.merchant_net_amount, item.currency),
              Status: <StatusBadge label={titleCase(safeString(item.payment_status))} />,
              Date: formatDate(item.sold_at)
            }))}
          />
        ) : (
          <EmptyState title="No sale records yet" description="Paid online purchases and manually recorded physical voucher sales will appear here." />
        )}
      </section>

      <section className="mt-5">
        <h2 className="mb-3 text-lg font-semibold text-ink">Recent Online Sales</h2>
        {loading && !transactions.length ? (
          <EmptyState title="Loading sales" description="Revenue records are being loaded." />
        ) : filteredTransactions.length ? (
          <DataTable
            columns={["Transaction ID", "Customer", "Phone", "HotSpot", "Package", "Amount", "Provider", "Payment Status", "Voucher", "Device", "Date"]}
            rows={filteredTransactions.map((item) => ({
              "Transaction ID": safeString(item.transaction_id) || "-",
              Customer: safeString(item.customer) || "-",
              Phone: safeString(item.phone) || "-",
              HotSpot: safeString(item.hotspot) || "-",
              Package: safeString(item.package) || "-",
              Amount: money(item.amount, item.currency),
              Provider: titleCase(safeString(item.provider)),
              "Payment Status": <StatusBadge label={titleCase(safeString(item.payment_status))} />,
              Voucher: safeString(item.voucher) || "-",
              Device: safeString(item.device) || "-",
              Date: formatDate(item.paid_at ?? item.created_at)
            }))}
          />
        ) : (
          <EmptyState title="No online sales yet" description="Paid HotSpot purchases will appear here. Generated physical vouchers are not counted as revenue." />
        )}
      </section>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function Breakdown({ title, rows, onSelect }: { title: string; rows: BreakdownRow[]; onSelect?: (id: string) => void }) {
  return (
    <div className="panel p-5">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-4 divide-y divide-line">
        {rows.length ? rows.map((row, index) => (
          <button key={safeString(row.id) || `${title}-${index}`} type="button" className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-3 py-3 text-left text-sm" onClick={() => onSelect?.(safeString(row.id))}>
            <span className="font-medium text-ink">{safeString(row.name) || "-"}</span>
            <span className="text-muted">{safeNumber(row.sales)} sales</span>
            <span className="font-semibold text-accent">{money(row.revenue, row.currency)}</span>
          </button>
        )) : <p className="py-3 text-sm text-muted">No paid sales in this range.</p>}
      </div>
    </div>
  );
}

function money(value: number, currency = "UGX") {
  return `${safeString(currency) || "UGX"} ${new Intl.NumberFormat("en-UG").format(safeNumber(value))}`;
}

function shortMoney(value: number) {
  if (value >= 1000000) return `${Math.round(value / 100000) / 10}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return String(value || 0);
}

function titleCase(value: string) {
  const text = safeString(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : "-";
}

function formatDate(value: string) {
  const text = safeString(value);
  if (!text) return "-";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function asArray<T>(value: T[] | unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function saleSearchText(item: Sale) {
  return [
    item.customer_name,
    item.phone,
    item.payment_reference,
    item.source,
    item.payment_status,
    item.currency,
    item.gross_amount
  ]
    .map(safeString)
    .join(" ")
    .toLowerCase();
}

function transactionSearchText(item: Transaction) {
  return [
    item.transaction_id,
    item.customer,
    item.phone,
    item.hotspot,
    item.package,
    item.provider,
    item.payment_status,
    item.voucher,
    item.device,
    item.amount
  ]
    .map(safeString)
    .join(" ")
    .toLowerCase();
}

function safeString(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function safeNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeRevenueSummary(value: RevenueSummary | unknown): RevenueSummary {
  const input = value && typeof value === "object" ? value as Partial<RevenueSummary> : {};
  return {
    currency: safeString(input.currency) || "UGX",
    total_revenue: safeNumber(input.total_revenue),
    today_revenue: safeNumber(input.today_revenue),
    week_revenue: safeNumber(input.week_revenue),
    month_revenue: safeNumber(input.month_revenue),
    successful_payments: safeNumber(input.successful_payments),
    pending_payments: safeNumber(input.pending_payments),
    failed_payments: safeNumber(input.failed_payments),
    pending_value: safeNumber(input.pending_value)
  };
}

function normalizeSalesSummary(value: SalesSummary | unknown): SalesSummary {
  const input = value && typeof value === "object" ? value as Partial<SalesSummary> : {};
  return {
    currency: safeString(input.currency) || "UGX",
    gross_sales: safeNumber(input.gross_sales),
    platform_fees: safeNumber(input.platform_fees),
    merchant_net: safeNumber(input.merchant_net),
    physical_sales: safeNumber(input.physical_sales)
  };
}
