import { EmptyState, OperationsTitle } from "@/components/OperationsUI";

export default function UsageAnalyticsPage() {
  return (
    <>
      <OperationsTitle title="Usage analytics" description="Usage analytics will appear here after accounting and telemetry endpoints are connected." />
      <EmptyState title="No usage analytics available" description="Connect accounting and telemetry endpoints to populate traffic, users, sessions, and charts." />
    </>
  );
}
