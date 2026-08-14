import { EmptyState, OperationsTitle } from "@/components/OperationsUI";

export default function SmsPage() {
  return (
    <>
      <OperationsTitle title="SMS" description="SMS balances, templates, and campaign activity will appear here after SMS endpoints are connected." />
      <EmptyState title="No SMS data available" description="Connect SMS endpoints to populate campaigns, templates, and delivery stats." />
    </>
  );
}
