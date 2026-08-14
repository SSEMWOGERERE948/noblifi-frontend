import { OperationsPage, StatusBadge } from "@/components/OperationsUI";

export default function AgentPosPage() {
  return (
    <OperationsPage
      title="Agent POS"
      description="Monitor agents, outlets, commissions, and transactions across your hotspot network in Uganda."
      actionLabel="Add agent"
      metrics={[
        { label: "Active agents", value: "128", change: "8.5%", detail: "Across 94 outlets", icon: "A" },
        { label: "Today POS sales", value: "UGX 2,340,500", change: "12.6%", detail: "vs yesterday", icon: "S" },
        { label: "Agent commissions", value: "UGX 351,075", change: "9.3%", detail: "Estimated for today", icon: "%" },
        { label: "Outlet uptime", value: "98.2%", change: "2.1%", detail: "Average uptime", icon: "U" }
      ]}
      trendTitle="Sales by agent"
      points={[
        { label: "Nakulabye", value: 680, display: "680K" },
        { label: "Wandegeya", value: 560, display: "560K" },
        { label: "Kampala Rd", value: 420, display: "420K" },
        { label: "Makerere", value: 360, display: "360K" },
        { label: "Other", value: 180, display: "180K" }
      ]}
      recentTitle="Recent agent POS transactions"
      recent={[
        { title: "John S. - Nakulabye", subtitle: "Nakulabye Outlet", meta: "10:24 AM", value: "+UGX 150,000" },
        { title: "Grace N. - Wandegeya", subtitle: "Wandegeya Corner", meta: "09:41 AM", value: "+UGX 80,000" },
        { title: "Brian K. - Kampala Rd", subtitle: "Kampala Road Point", meta: "08:15 AM", value: "+UGX 120,000" }
      ]}
      tableTitle="Agents"
      columns={["Agent", "Outlet", "Float", "Sales today", "Commission", "Status"]}
      rows={[
        { Agent: "John Ssempala", Outlet: "Nakulabye Outlet", Float: "UGX 300,000", "Sales today": "UGX 150,000", Commission: "UGX 22,500", Status: <StatusBadge label="Active" /> },
        { Agent: "Grace Nakato", Outlet: "Wandegeya Corner", Float: "UGX 250,000", "Sales today": "UGX 80,000", Commission: "UGX 12,000", Status: <StatusBadge label="Active" /> },
        { Agent: "Joseph Mukasa", Outlet: "Mukono Town", Float: "UGX 180,000", "Sales today": "UGX 40,000", Commission: "UGX 6,000", Status: <StatusBadge label="Idle" /> }
      ]}
    />
  );
}
