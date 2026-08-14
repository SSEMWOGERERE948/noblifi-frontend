import { OperationsPage, StatusBadge } from "@/components/OperationsUI";

export default function BillingPage() {
  return (
    <OperationsPage
      title="Billing"
      description="Manage subscriptions, invoices, plan usage, and account charges."
      actionLabel="Create invoice"
      metrics={[
        { label: "Monthly recurring revenue", value: "UGX 12,540,000", change: "14.6%", detail: "vs last period", icon: "M" },
        { label: "Invoices due", value: "UGX 2,730,000", change: "8.8%", detail: "vs last period", icon: "I" },
        { label: "Paid this month", value: "UGX 9,810,000", change: "12.3%", detail: "vs last period", icon: "P" },
        { label: "Overdue accounts", value: "UGX 1,245,000", change: "3.2%", detail: "vs last period", negative: true, icon: "!" }
      ]}
      trendTitle="Invoice revenue trend"
      trendDescription="Aug 1, 2026 - Aug 5, 2026"
      points={[
        { label: "Aug 1", value: 2100, display: "2.1M" },
        { label: "Aug 2", value: 3400, display: "3.4M" },
        { label: "Aug 3", value: 4800, display: "4.8M" },
        { label: "Aug 4", value: 3900, display: "3.9M" },
        { label: "Aug 5", value: 6200, display: "6.2M" }
      ]}
      recentTitle="Recent invoices"
      recent={[
        { title: "INV-2026-0087", subtitle: "Mukama Branch", meta: "Aug 5, 2026", value: "+UGX 520,000" },
        { title: "INV-2026-0086", subtitle: "Genesis Spot", meta: "Aug 5, 2026", value: "+UGX 310,000" },
        { title: "INV-2026-0083", subtitle: "Mbarara Router Hub", meta: "Aug 3, 2026", value: "+UGX 180,000", negative: true }
      ]}
      tableTitle="Billing accounts"
      columns={["Account", "Plan", "Amount", "Due date", "Payment status", "Auto-renew"]}
      rows={[
        { Account: "Mukama Branch", Plan: "Professional", Amount: "UGX 520,000", "Due date": "Aug 10, 2026", "Payment status": <StatusBadge label="Paid" />, "Auto-renew": "On" },
        { Account: "Genesis Spot", Plan: "Standard", Amount: "UGX 310,000", "Due date": "Aug 9, 2026", "Payment status": <StatusBadge label="Sent" />, "Auto-renew": "On" },
        { Account: "City Outlet", Plan: "Professional", Amount: "UGX 420,000", "Due date": "Aug 12, 2026", "Payment status": <StatusBadge label="Due" />, "Auto-renew": "On" }
      ]}
    />
  );
}
