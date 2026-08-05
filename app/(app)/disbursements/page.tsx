import { PageHeader } from "@/components/PageHeader";
import { currency } from "@/lib/static-data";

const rows = [
  ["DSB-1004", "Bank transfer", `${currency} 145,000`, "Queued"],
  ["DSB-1003", "Mobile money", `${currency} 84,500`, "Paid"],
  ["DSB-1002", "Mobile money", `${currency} 69,000`, "Paid"]
];

export default function DisbursementsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Disbursements" description="Static payout queue and settlement history." />
      <section className="panel divide-y divide-line">
        {rows.map(([id, method, amount, status]) => (
          <div key={id} className="grid gap-3 p-4 text-sm md:grid-cols-4">
            <span className="font-semibold text-ink">{id}</span>
            <span className="text-muted">{method}</span>
            <span className="font-semibold text-ink">{amount}</span>
            <span className="text-muted">{status}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
