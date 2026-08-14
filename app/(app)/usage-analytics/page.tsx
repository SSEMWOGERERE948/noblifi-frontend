import { MetricGrid, OperationsTitle, TrendPanel } from "@/components/OperationsUI";

export default function UsageAnalyticsPage() {
  return (
    <>
      <OperationsTitle title="Usage analytics" description="Static insight preview for hotspot consumption, session behavior, and router demand." />
      <MetricGrid
        metrics={[
          { label: "Total data usage", value: "1.79 TB", detail: "Consumed in selected period", change: "30.3%", negative: true, icon: "D" },
          { label: "Unique users", value: "996", detail: "Distinct devices and voucher users", change: "7.7%", negative: true, icon: "U" },
          { label: "Avg session duration", value: "1h 21m", detail: "Average connected time", change: "21.0%", negative: true, icon: "T" },
          { label: "Total sessions", value: "7,236", detail: "Connections in selected period", change: "19.7%", negative: true, icon: "S" }
        ]}
      />
      <div className="mt-5">
        <TrendPanel
          title="Data usage over time"
          description="Daily data consumption across all hotspot locations."
          points={[
            { label: "Aug 1", value: 270, display: "270 GB" },
            { label: "Aug 2", value: 160, display: "160 GB" },
            { label: "Aug 3", value: 330, display: "330 GB" },
            { label: "Aug 4", value: 250, display: "250 GB" },
            { label: "Aug 5", value: 490, display: "490 GB" }
          ]}
        />
      </div>
    </>
  );
}
