import { MetricGrid, OperationsTitle, RecentPanel, TrendPanel } from "@/components/OperationsUI";

const metrics = [
  { label: "Gross sales", value: "UGX 530,000", detail: "Mobile money and voucher counter sales", change: "12.4%", icon: "S" },
  { label: "Voucher sales", value: "UGX 384,500", detail: "Printed and portal-issued vouchers", change: "8.7%", icon: "V" },
  { label: "Available float", value: "UGX 221,900", detail: "Static balance placeholder", change: "3.1%", icon: "F" },
  { label: "Active sessions", value: "270", detail: "Across all hotspot routers", change: "5.2%", icon: "U" }
];

const points = [
  { label: "Aug 1", value: 260, display: "260K" },
  { label: "Aug 2", value: 180, display: "180K" },
  { label: "Aug 3", value: 420, display: "420K" },
  { label: "Aug 4", value: 320, display: "320K" },
  { label: "Aug 5", value: 530, display: "530K" }
];

const recent = [
  { title: "NF-8Q2K7A", subtitle: "Day Pass - voucher portal", meta: "10:24 AM", value: "+UGX 1,500" },
  { title: "NF-3H9M2P", subtitle: "24 Hours - agent pos", meta: "09:41 AM", value: "+UGX 2,000" },
  { title: "NF-7T4V1C", subtitle: "48 Hours - mobile checkout", meta: "08:15 AM", value: "+UGX 3,500" },
  { title: "NF-1K8L9D", subtitle: "Day Pass - voucher portal", meta: "Yesterday", value: "+UGX 1,000" },
  { title: "NF-9P2B6X", subtitle: "Weekly - agent pos", meta: "Yesterday", value: "+UGX 5,000" }
];

export default function DashboardPage() {
  return (
    <>
      <OperationsTitle title="Account dashboard" description="Static preview for sales, routers, usage, and account limits. Live data can replace these values later." />
      <MetricGrid metrics={metrics} />
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <TrendPanel
          title="Revenue overview"
          description="Aug 1, 2026 - Aug 5, 2026"
          points={points}
          footer={
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted">Total revenue</p>
                <p className="mt-1 text-xl font-semibold text-ink">UGX 1,710,000</p>
              </div>
              <div>
                <p className="text-muted">Avg. daily revenue</p>
                <p className="mt-1 text-xl font-semibold text-ink">UGX 342,000</p>
              </div>
            </div>
          }
        />
        <RecentPanel title="Recent sales" items={recent} />
      </div>
    </>
  );
}
