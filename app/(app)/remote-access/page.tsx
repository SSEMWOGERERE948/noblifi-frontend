import { OperationsPage, StatusBadge } from "@/components/OperationsUI";

export default function RemoteAccessPage() {
  return (
    <OperationsPage
      title="Remote Access"
      description="Secure VPN connectivity, WireGuard tunnels, Winbox access, and remote router administration."
      actionLabel="Add peer"
      metrics={[
        { label: "Active VPN peers", value: "42", change: "16.7%", detail: "vs last period", icon: "P" },
        { label: "Online routers", value: "38", change: "11.8%", detail: "vs last period", icon: "R" },
        { label: "Failed connections", value: "7", change: "22.2%", detail: "vs last period", negative: true, icon: "!" },
        { label: "Average latency", value: "28 ms", change: "12.5%", detail: "vs last period", icon: "L" }
      ]}
      trendTitle="Tunnel health"
      trendDescription="Successful handshakes over time."
      points={[
        { label: "Aug 1", value: 38, display: "38" },
        { label: "Aug 2", value: 45, display: "45" },
        { label: "Aug 3", value: 62, display: "62" },
        { label: "Aug 4", value: 41, display: "41" },
        { label: "Aug 5", value: 68, display: "68" }
      ]}
      recentTitle="Recent connection events"
      recent={[
        { title: "Peer NB-PEER-042 connected", subtitle: "WireGuard handshake successful", meta: "10:24 AM", status: "Success" },
        { title: "Peer NB-PEER-021 failed", subtitle: "Timeout - no response from router", meta: "09:12 AM", status: "Failed" },
        { title: "High latency detected", subtitle: "Average latency: 156 ms", meta: "08:33 AM", status: "Warning" }
      ]}
      tableTitle="Router access"
      columns={["Router", "Tunnel IP", "Winbox", "WebFig", "Last handshake", "Status"]}
      rows={[
        { Router: "Mukama Branch", "Tunnel IP": "10.66.0.2", Winbox: "10.66.0.2:8291", WebFig: "https://10.66.0.2", "Last handshake": "10:24 AM", Status: <StatusBadge label="Online" /> },
        { Router: "Genesis Spot", "Tunnel IP": "10.66.0.3", Winbox: "10.66.0.3:8291", WebFig: "https://10.66.0.3", "Last handshake": "09:41 AM", Status: <StatusBadge label="Online" /> },
        { Router: "Reversal Branch", "Tunnel IP": "10.66.0.6", Winbox: "10.66.0.6:8291", WebFig: "https://10.66.0.6", "Last handshake": "Aug 3", Status: <StatusBadge label="High latency" /> }
      ]}
    />
  );
}
