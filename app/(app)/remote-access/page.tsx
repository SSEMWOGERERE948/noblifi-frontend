import { EmptyState, OperationsTitle } from "@/components/OperationsUI";

export default function RemoteAccessPage() {
  return (
    <>
      <OperationsTitle title="Remote Access" description="Remote access health will appear here after VPN telemetry endpoints are connected." />
      <EmptyState title="No remote access summary available" description="Use each router detail page for real bootstrap scripts and setup flows." />
    </>
  );
}
