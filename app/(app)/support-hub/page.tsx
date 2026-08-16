import { EmptyState, OperationsTitle } from "@/components/OperationsUI";

export default function SupportHubPage() {
  return (
    <>
      <OperationsTitle title="Support hub" description="Support tickets will appear here after ticket endpoints are connected." />
      <EmptyState title="No support tickets available" description="Connect ticket endpoints to populate support requests." />
    </>
  );
}
