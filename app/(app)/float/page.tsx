import { OperationsPage, StatusBadge } from "@/components/OperationsUI";

export default function FloatPage() {
  return (
    <OperationsPage
      title="Float"
      description="Monitor account balances, top-ups, and disbursements in real time."
      actionLabel="Top up float"
      metrics={[
        { label: "Available float", value: "UGX 221,900", change: "3.1%", detail: "vs last period", icon: "F" },
        { label: "Pending top-ups", value: "UGX 540,000", change: "12.4%", detail: "vs last period", icon: "T" },
        { label: "Today disbursements", value: "UGX 186,500", change: "8.7%", detail: "vs last period", negative: true, icon: "D" },
        { label: "Active agent balances", value: "UGX 1,480,000", change: "5.2%", detail: "vs last period", icon: "A" }
      ]}
      trendTitle="Float movement"
      trendDescription="Change in available float balance over time."
      points={[
        { label: "Aug 1", value: 260, display: "260K" },
        { label: "Aug 2", value: 180, display: "180K" },
        { label: "Aug 3", value: 420, display: "420K" },
        { label: "Aug 4", value: 320, display: "320K" },
        { label: "Aug 5", value: 530, display: "530K" }
      ]}
      recentTitle="Recent top-ups & disbursements"
      recent={[
        { title: "FLT-TP-87231", subtitle: "Top-up via bank transfer", meta: "10:24 AM", value: "+UGX 500,000" },
        { title: "FLT-DIS-99102", subtitle: "Agent disbursement - Mukama Branch", meta: "09:41 AM", value: "-UGX 120,000", negative: true },
        { title: "FLT-TP-87129", subtitle: "Top-up via mobile money", meta: "Yesterday", value: "+UGX 200,000" }
      ]}
      tableTitle="Agent balances"
      columns={["Agent", "Balance", "Last activity", "Status"]}
      rows={[
        { Agent: "Mukama Branch", Balance: "UGX 520,000", "Last activity": "10:24 AM", Status: <StatusBadge label="Healthy" /> },
        { Agent: "Genesis Spot", Balance: "UGX 310,000", "Last activity": "09:41 AM", Status: <StatusBadge label="Healthy" /> },
        { Agent: "God's Plan", Balance: "UGX 260,000", "Last activity": "Yesterday", Status: <StatusBadge label="Low" /> }
      ]}
    />
  );
}
