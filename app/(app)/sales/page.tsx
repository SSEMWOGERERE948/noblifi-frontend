import { OperationsPage, StatusBadge } from "@/components/OperationsUI";

export default function SalesPage() {
  return (
    <OperationsPage
      title="Sales"
      description="Track voucher, mobile money, and agent sales performance across all channels."
      actionLabel="New sale"
      metrics={[
        { label: "Total sales", value: "UGX 2,480,000", change: "12.4%", detail: "vs last period", icon: "S" },
        { label: "Voucher sales", value: "UGX 1,120,500", change: "8.7%", detail: "vs last period", icon: "V" },
        { label: "Mobile money sales", value: "UGX 860,000", change: "6.3%", detail: "vs last period", icon: "M" },
        { label: "Agent POS sales", value: "UGX 499,500", change: "5.2%", detail: "vs last period", icon: "A" }
      ]}
      trendTitle="Sales trend"
      trendDescription="Aug 1, 2026 - Aug 5, 2026"
      points={[
        { label: "Aug 1", value: 420, display: "420K" },
        { label: "Aug 2", value: 610, display: "610K" },
        { label: "Aug 3", value: 780, display: "780K" },
        { label: "Aug 4", value: 545, display: "545K" },
        { label: "Aug 5", value: 1130, display: "1.13M" }
      ]}
      recentTitle="Recent transactions"
      recent={[
        { title: "NF-8Q2K7A", subtitle: "Voucher portal", meta: "10:24 AM", value: "+UGX 150,000" },
        { title: "NF-3H9M2P", subtitle: "Agent pos", meta: "09:41 AM", value: "+UGX 80,000" },
        { title: "NF-7T4V1C", subtitle: "Mobile checkout", meta: "08:15 AM", value: "+UGX 120,000" },
        { title: "NF-1K8L9D", subtitle: "Voucher portal", meta: "Yesterday", value: "+UGX 60,000" }
      ]}
      tableTitle="Sales by channel"
      columns={["Channel", "Revenue", "Share", "Status"]}
      rows={[
        { Channel: "Voucher portal", Revenue: "UGX 1,120,500", Share: "45%", Status: <StatusBadge label="Active" /> },
        { Channel: "Agent POS", Revenue: "UGX 499,500", Share: "20%", Status: <StatusBadge label="Active" /> },
        { Channel: "Mobile Money", Revenue: "UGX 860,000", Share: "35%", Status: <StatusBadge label="Active" /> }
      ]}
    />
  );
}
