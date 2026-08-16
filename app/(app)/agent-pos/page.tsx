import { EmptyState, OperationsTitle } from "@/components/OperationsUI";

export default function AgentPosPage() {
  return (
    <>
      <OperationsTitle title="Agent POS" description="Agent POS activity will appear here after agent endpoints are connected." />
      <EmptyState title="No agent POS data available" description="Connect agent and outlet endpoints to populate this page with live records." />
    </>
  );
}
