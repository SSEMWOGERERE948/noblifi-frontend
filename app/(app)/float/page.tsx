import { EmptyState, OperationsTitle } from "@/components/OperationsUI";

export default function FloatPage() {
  return (
    <>
      <OperationsTitle title="Float" description="Float balances will appear here after float ledger endpoints are connected." />
      <EmptyState title="No float data available" description="Connect float ledger endpoints to populate top-ups, disbursements, and balances." />
    </>
  );
}
