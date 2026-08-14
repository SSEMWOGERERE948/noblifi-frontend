import { OperationsPage, StatusBadge } from "@/components/OperationsUI";

export default function PaymentGatewaysPage() {
  return (
    <OperationsPage
      title="Payment Gateways"
      description="Monitor collections, settlements, reconciliation, and gateway health in real time."
      actionLabel="Connect gateway"
      metrics={[
        { label: "Total collections", value: "UGX 2,893,400,000", change: "12.6%", detail: "vs last period", icon: "C" },
        { label: "Settlements pending", value: "UGX 458,750,000", change: "8.4%", detail: "vs last period", negative: true, icon: "T" },
        { label: "Gateway success rate", value: "96.42%", change: "2.7%", detail: "vs last period", icon: "G" },
        { label: "Fees this month", value: "UGX 26,540,000", change: "6.1%", detail: "vs last period", icon: "%" }
      ]}
      trendTitle="Collections trend"
      trendDescription="Daily collections across all payment gateways."
      points={[
        { label: "Aug 1", value: 460, display: "460M" },
        { label: "Aug 2", value: 650, display: "650M" },
        { label: "Aug 3", value: 820, display: "820M" },
        { label: "Aug 4", value: 610, display: "610M" },
        { label: "Aug 5", value: 950, display: "950M" }
      ]}
      recentTitle="Recent settlements"
      recent={[
        { title: "Settlement to Stanbic Bank", subtitle: "REF: SET-20260805-001", meta: "Aug 5, 10:24 AM", value: "+UGX 320,000,000" },
        { title: "Settlement to DFCU Bank", subtitle: "REF: SET-20260805-002", meta: "Aug 5, 09:41 AM", value: "+UGX 180,000,000" },
        { title: "Settlement to MTN MoMo", subtitle: "REF: SET-20260804-002", meta: "Aug 4, 02:33 PM", value: "+UGX 145,000,000" }
      ]}
      tableTitle="Gateways"
      columns={["Gateway", "Method", "Volume", "Success rate", "Last sync", "Status"]}
      rows={[
        { Gateway: "Mobile Money", Method: "Mobile Money", Volume: "UGX 1,247,800,000", "Success rate": "97.41%", "Last sync": "Aug 5, 10:23 AM", Status: <StatusBadge label="Healthy" /> },
        { Gateway: "Card Payments", Method: "Cards", Volume: "UGX 732,450,000", "Success rate": "95.12%", "Last sync": "Aug 5, 10:22 AM", Status: <StatusBadge label="Healthy" /> },
        { Gateway: "Pesapal", Method: "Payment Gateway", Volume: "UGX 518,760,000", "Success rate": "96.87%", "Last sync": "Aug 5, 10:21 AM", Status: <StatusBadge label="Healthy" /> }
      ]}
    />
  );
}
