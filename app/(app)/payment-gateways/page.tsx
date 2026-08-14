import { EmptyState, OperationsTitle } from "@/components/OperationsUI";

export default function PaymentGatewaysPage() {
  return (
    <>
      <OperationsTitle title="Payment Gateways" description="Gateway health and settlement data will appear here after payment endpoints are connected." />
      <EmptyState title="No payment gateway data available" description="Connect payment endpoints to populate collections, settlements, and gateway health." />
    </>
  );
}
