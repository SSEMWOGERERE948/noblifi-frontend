import { PageHeader } from "@/components/PageHeader";

const stats = [
  { label: "Total Routers", value: "12" },
  { label: "Online Routers", value: "9" },
  { label: "Active Hotspot Users", value: "184" },
  { label: "Today's Revenue", value: "$428" }
];

export default function DashboardPage() {
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

