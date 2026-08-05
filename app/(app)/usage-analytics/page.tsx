import { BarChart, LineChart } from "@/components/StaticCharts";
import { PageHeader } from "@/components/PageHeader";
import { usageByDay } from "@/lib/static-data";

const cards = [
  { label: "Total data usage", value: "1.79 TB", note: "Consumed in selected period", delta: "-30.3%" },
  { label: "Unique users", value: "996", note: "Distinct devices and voucher users", delta: "-7.7%" },
  { label: "Avg session duration", value: "1h 21m", note: "Average connected time", delta: "-21.0%" },
  { label: "Total sessions", value: "7,236", note: "Connections in selected period", delta: "-19.7%" }
];

export default function UsageAnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Usage analytics"
        description="Static insight preview for hotspot consumption, session behavior, and router demand."
        action={<button className="btn-secondary" type="button">Aug 1, 2026 - Aug 5, 2026</button>}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="panel p-5">
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{card.value}</p>
            <p className="mt-2 text-sm text-muted">{card.note}</p>
            <p className="mt-4 text-sm font-semibold text-red-300">{card.delta} vs last period</p>
          </div>
        ))}
      </section>

      <section className="panel p-5">
        <h2 className="text-xl font-semibold text-ink">Data usage over time</h2>
        <p className="mb-4 text-sm text-muted">Daily data consumption across all hotspot locations.</p>
        <BarChart data={usageByDay} suffix=" GB" />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="panel p-5">
          <h2 className="mb-4 text-xl font-semibold text-ink">Session trend</h2>
          <LineChart data={usageByDay.map((item) => ({ ...item, value: Math.round(item.value / 3) }))} label="Static session trend" />
        </div>
        <div className="panel p-5">
          <h2 className="text-xl font-semibold text-ink">Top hotspot locations</h2>
          <div className="mt-4 divide-y divide-line text-sm">
            {["Main Lobby", "Outdoor Garden", "Annex Wing", "Conference Hall"].map((name, index) => (
              <div key={name} className="flex justify-between py-3">
                <span className="font-medium text-ink">{name}</span>
                <span className="text-muted">{[612, 488, 356, 291][index]} GB</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
