import { OperationsPage, StatusBadge } from "@/components/OperationsUI";

export default function SmsPage() {
  return (
    <OperationsPage
      title="SMS"
      description="Monitor SMS delivery balance, OTP messages, campaigns, and alerts across your network."
      actionLabel="New campaign"
      metrics={[
        { label: "SMS balance", value: "UGX 1,240,000", change: "12.6%", detail: "124,000 SMS", icon: "M" },
        { label: "Delivered today", value: "12,486", change: "18.4%", detail: "vs last period", icon: "D" },
        { label: "Failed deliveries", value: "243", change: "6.3%", detail: "vs last period", negative: true, icon: "!" },
        { label: "Open rate", value: "28.6%", change: "5.7%", detail: "vs last period", icon: "O" }
      ]}
      trendTitle="Delivery trend"
      trendDescription="SMS delivery performance over time."
      points={[
        { label: "Aug 1", value: 4200, display: "4.2K" },
        { label: "Aug 2", value: 5600, display: "5.6K" },
        { label: "Aug 3", value: 7800, display: "7.8K" },
        { label: "Aug 4", value: 6100, display: "6.1K" },
        { label: "Aug 5", value: 9100, display: "9.1K" }
      ]}
      recentTitle="Recent campaigns"
      recent={[
        { title: "Weekend Promo - 10% Bonus", subtitle: "Promotional", meta: "Today, 10:24 AM", status: "Delivered" },
        { title: "OTP Login Messages", subtitle: "Transactional", meta: "Today, 09:41 AM", status: "Delivered" },
        { title: "Payment Reminder - Aug", subtitle: "Transactional", meta: "Yesterday", status: "In progress" }
      ]}
      tableTitle="Message templates"
      columns={["Template", "Type", "Sent", "Delivered", "Failed", "Status"]}
      rows={[
        { Template: "OTP Login", Type: "Transactional", Sent: "4,812", Delivered: "4,726 (98.2%)", Failed: "86 (1.8%)", Status: <StatusBadge label="Active" /> },
        { Template: "Voucher Receipt", Type: "Transactional", Sent: "2,764", Delivered: "2,712 (98.1%)", Failed: "52 (1.9%)", Status: <StatusBadge label="Active" /> },
        { Template: "Router Outage Alert", Type: "Alert", Sent: "620", Delivered: "610 (98.4%)", Failed: "10 (1.6%)", Status: <StatusBadge label="Active" /> }
      ]}
    />
  );
}
