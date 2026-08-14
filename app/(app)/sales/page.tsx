import { EmptyState, OperationsTitle } from "@/components/OperationsUI";

export default function SalesPage() {
  return (
    <>
      <OperationsTitle title="Sales" description="Sales reporting will appear here after transaction endpoints are connected." />
      <EmptyState title="No sales data available" description="Connect sales collection endpoints to populate live revenue and transaction records." />
    </>
  );
}
