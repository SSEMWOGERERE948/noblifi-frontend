import { EmptyState, OperationsTitle } from "@/components/OperationsUI";

export default function BillingPage() {
  return (
    <>
      <OperationsTitle title="Billing" description="Billing accounts and invoices will appear here after billing endpoints are connected." />
      <EmptyState title="No billing data available" description="Connect billing endpoints to populate invoices, recurring revenue, and account balances." />
    </>
  );
}
