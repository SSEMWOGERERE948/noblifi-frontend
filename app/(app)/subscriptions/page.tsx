import { DataTable, MetricGrid, OperationsTitle, PageActions, RecentPanel, StatusBadge, TrendPanel } from "@/components/OperationsUI";

export default function SubscriptionsPage() {
  return (
    <>
      <OperationsTitle title="Subscriptions" description="Manage free trials, plan upgrades, renewals, and subscription health across all workspaces." action={<PageActions label="Create plan" />} />
      <section className="panel mb-5 flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink">30-day free trial model enabled</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">New customers start with a free 30-day trial after submitting business details, then upgrade to a paid subscription to keep using NobliFi.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="/plans" className="btn-secondary">View pricing</a>
          <button className="btn" type="button">Invite trial workspace</button>
        </div>
      </section>
      <MetricGrid
        metrics={[
          { label: "Active paid workspaces", value: "148", change: "12.4%", detail: "vs Jul 25 - Jul 31", icon: "W" },
          { label: "Trial workspaces", value: "63", change: "8.7%", detail: "vs Jul 25 - Jul 31", icon: "T" },
          { label: "Expiring in 7 days", value: "19", change: "26.7%", detail: "vs Jul 25 - Jul 31", negative: true, icon: "!" },
          { label: "Monthly recurring revenue", value: "UGX 18,450,000", change: "15.9%", detail: "vs Jul 25 - Jul 31", icon: "R" }
        ]}
      />
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <TrendPanel
          title="Trial conversion funnel"
          points={[
            { label: "Trial Started", value: 312, display: "312" },
            { label: "Details Verified", value: 241, display: "241" },
            { label: "Routers Added", value: 186, display: "186" },
            { label: "Payment Added", value: 142, display: "142" },
            { label: "Upgraded", value: 76, display: "76" }
          ]}
        />
        <RecentPanel title="Recent subscription events" items={[
          { title: "Mukama Branch", subtitle: "Started a free trial", meta: "5 minutes ago", status: "Trial started" },
          { title: "Genesis Spot", subtitle: "Trial expiring in 2 days", meta: "1 hour ago", status: "Trial expiring" },
          { title: "God's Plan", subtitle: "Upgraded to Growth plan", meta: "3 hours ago", status: "Upgraded" },
          { title: "City Outlet", subtitle: "Payment failed", meta: "5 hours ago", status: "Payment failed" }
        ]} />
      </div>
      <section className="mt-5">
        <h2 className="mb-3 text-lg font-semibold text-ink">Workspaces & subscriptions</h2>
        <DataTable
          columns={["Workspace", "Plan", "Trial start", "Trial end / renewal", "Routers", "Status", "MRR"]}
          rows={[
            { Workspace: "Mukama Branch", Plan: "Trial", "Trial start": "Aug 3, 2026", "Trial end / renewal": "Sep 2, 2026", Routers: "2", Status: <StatusBadge label="Trial" />, MRR: "UGX 0" },
            { Workspace: "Genesis Spot", Plan: "Starter", "Trial start": "Jul 20, 2026", "Trial end / renewal": "Aug 19, 2026", Routers: "3", Status: <StatusBadge label="Expiring" />, MRR: "UGX 0" },
            { Workspace: "God's Plan", Plan: "Growth", "Trial start": "Jul 1, 2026", "Trial end / renewal": "Aug 31, 2026", Routers: "6", Status: <StatusBadge label="Active" />, MRR: "UGX 420,000" },
            { Workspace: "City Outlet", Plan: "Starter", "Trial start": "Jun 18, 2026", "Trial end / renewal": "Jul 18, 2026", Routers: "1", Status: <StatusBadge label="Overdue" />, MRR: "UGX 0" }
          ]}
        />
      </section>
    </>
  );
}
