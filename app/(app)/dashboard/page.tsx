import { BarChart, LineChart } from "@/components/StaticCharts";
import { currency, revenueByDay, routerRows, salesRows } from "@/lib/static-data";

const totals = [
  { label: "Gross sales", value: `${currency} 530,000`, note: "Mobile money and voucher counter sales" },
  { label: "Voucher sales", value: `${currency} 384,500`, note: "Printed and portal-issued vouchers" },
  { label: "Available float", value: `${currency} 221,900`, note: "Static balance placeholder" },
  { label: "Active sessions", value: "270", note: "Across all hotspot routers" }
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">NobliFi Operations</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Account dashboard</h1>
        <p className="mt-2 text-sm text-muted">Static preview for sales, routers, usage, and account limits. Live data can replace these values later.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {totals.map((item) => (
          <div key={item.label} className="panel p-5">
            <p className="text-sm text-muted">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{item.value}</p>
            <p className="mt-2 text-xs text-muted">{item.note}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <div className="panel p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-ink">Revenue overview</h2>
              <p className="text-sm text-muted">Aug 1, 2026 - Aug 5, 2026</p>
            </div>
            <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-muted">Totals</span>
          </div>
          <BarChart data={revenueByDay} suffix=" UGX" />
        </div>

        <div className="panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-ink">Recent sales</h2>
              <p className="text-sm text-muted">{salesRows.length} latest static transactions</p>
            </div>
            <span className="text-xs text-muted">Today</span>
          </div>
          <div className="divide-y divide-line">
            {salesRows.map((sale) => (
              <div key={sale.code} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">{sale.code}</p>
                  <p className="text-muted">{sale.package} - {sale.channel.replaceAll("_", " ")}</p>
                </div>
                <p className="font-semibold text-ink">+{currency} {sale.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="panel p-5">
          <h2 className="text-xl font-semibold text-ink">Router health</h2>
          <div className="mt-4 divide-y divide-line">
            {routerRows.map((router) => (
              <div key={router.id} className="grid gap-3 py-3 text-sm md:grid-cols-5">
                <span className="font-semibold text-ink">{router.name}</span>
                <span className="text-muted">{router.status}</span>
                <span className="text-muted">CPU {router.cpu}%</span>
                <span className="text-muted">Memory {router.memory}%</span>
                <span className="text-muted">{router.users} users</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="mb-4 text-xl font-semibold text-ink">Sales trend</h2>
          <LineChart data={revenueByDay} label="Static sales trend" />
        </div>
      </section>
    </div>
  );
}
