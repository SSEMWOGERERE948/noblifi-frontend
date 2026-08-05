import { PageHeader } from "@/components/PageHeader";

const gateways = [
  ["Mobile money", "Connected", "Primary customer checkout rail"],
  ["Card payments", "Draft", "Reserved for future online payments"],
  ["Bank transfer", "Manual", "Settlement and top-up reconciliation"]
];

export default function PaymentGatewaysPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Payment gateways" description="Static provider setup and channel availability." />
      <section className="panel divide-y divide-line">
        {gateways.map(([name, status, description]) => (
          <div key={name} className="grid gap-3 p-4 text-sm md:grid-cols-3">
            <span className="font-semibold text-ink">{name}</span>
            <span className="text-muted">{description}</span>
            <span className="text-muted">{status}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
