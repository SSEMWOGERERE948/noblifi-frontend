import { DataTable, MetricGrid, OperationsTitle, PageActions, RecentPanel, StatusBadge } from "@/components/OperationsUI";

const templates = [
  { name: "Classic Portal", desc: "Default portal with login and social access", status: "Published" },
  { name: "Promo Splash", desc: "Marketing splash with promo banner", status: "Published" },
  { name: "Event Access", desc: "Event registration with email capture", status: "Draft" },
  { name: "Branch Branded", desc: "Branded portal for branch locations", status: "Published" }
];

export default function CaptiveTemplatesPage() {
  return (
    <>
      <OperationsTitle title="Captive Templates" description="Design, customize, and manage hotspot portal templates and branding experiences." action={<PageActions label="Create template" />} />
      <MetricGrid
        metrics={[
          { label: "Published templates", value: "24", change: "14.3%", detail: "vs last period", icon: "P" },
          { label: "Draft templates", value: "8", change: "6.7%", detail: "vs last period", icon: "D" },
          { label: "A/B tests", value: "5", change: "25.0%", detail: "vs last period", icon: "A" },
          { label: "Conversion rate", value: "28.6%", change: "7.9%", detail: "vs last period", icon: "%" }
        ]}
      />
      <section className="mt-5 grid gap-4 lg:grid-cols-4">
        {templates.map((template) => (
          <article key={template.name} className="panel overflow-hidden">
            <div className="flex h-40 items-center justify-center bg-gradient-to-br from-emerald-500/20 via-sky-500/10 to-panel p-5 text-center">
              <div>
                <p className="text-sm text-muted">Welcome to</p>
                <p className="mt-1 text-xl font-semibold text-ink">NobliFi WiFi</p>
                <button className="btn mt-5 px-8 py-2" type="button">Connect</button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-ink">{template.name}</h2>
                  <p className="mt-1 text-xs text-muted">{template.desc}</p>
                </div>
                <StatusBadge label={template.status} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button className="btn-secondary px-3 py-1.5" type="button">Preview</button>
                <button className="btn-secondary px-3 py-1.5" type="button">Duplicate</button>
              </div>
            </div>
          </article>
        ))}
      </section>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        <DataTable columns={["Template", "Sessions", "Conversions", "Conversion rate"]} rows={[
          { Template: "Classic Portal", Sessions: "2,340", Conversions: "842", "Conversion rate": "35.9%" },
          { Template: "Promo Splash", Sessions: "1,870", Conversions: "560", "Conversion rate": "29.9%" },
          { Template: "Event Access", Sessions: "1,420", Conversions: "318", "Conversion rate": "22.4%" }
        ]} />
        <RecentPanel title="Publish queue & recent edits" items={[
          { title: "Summer Promo", subtitle: "Scheduled for Aug 6, 2026 09:00 AM", meta: "Queue", status: "Scheduled" },
          { title: "Promo Splash", subtitle: "Edited by Admin", meta: "Aug 5, 10:24 AM", status: "Published" },
          { title: "Branch Branded", subtitle: "Edited by Admin", meta: "Aug 4, 04:15 PM", status: "Published" }
        ]} />
      </div>
    </>
  );
}
