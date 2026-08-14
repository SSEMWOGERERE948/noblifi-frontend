import { EmptyState, OperationsTitle } from "@/components/OperationsUI";

export default function SubscriptionsPage() {
  return (
    <>
      <OperationsTitle title="Subscriptions" description="Subscription health will appear here after subscription endpoints are connected." />
      <EmptyState title="No subscription data available" description="Connect subscription endpoints to populate trials, renewals, and workspace subscription rows." />
    </>
  );
}
