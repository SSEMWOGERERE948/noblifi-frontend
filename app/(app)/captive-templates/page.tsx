import { EmptyState, OperationsTitle } from "@/components/OperationsUI";

export default function CaptiveTemplatesPage() {
  return (
    <>
      <OperationsTitle title="Captive Templates" description="Captive portal templates will appear here after template endpoints are connected." />
      <EmptyState title="No captive templates available" description="Connect template endpoints to populate portal templates and performance data." />
    </>
  );
}
