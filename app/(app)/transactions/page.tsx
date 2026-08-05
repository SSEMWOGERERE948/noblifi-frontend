import { PageHeader } from "@/components/PageHeader";
import { currency, salesRows } from "@/lib/static-data";

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Transactions" description="Static ledger of payments, voucher credits, and account adjustments." />
      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Successful", `${currency} 530,000`],
          ["Pending", `${currency} 42,000`],
          ["Failed", `${currency} 8,500`]
        ].map(([label, value]) => (
          <div key={label} className="panel p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
          </div>
        ))}
      </section>
      <section className="panel divide-y divide-line">
        {salesRows.map((row) => (
          <div key={row.code} className="grid gap-3 p-4 text-sm md:grid-cols-5">
            <span className="font-mono font-semibold text-ink">{row.code}</span>
            <span className="text-muted">{row.name}</span>
            <span className="text-muted">{row.channel}</span>
            <span className="font-semibold text-ink">{currency} {row.amount.toLocaleString()}</span>
            <span className="text-muted">{row.created}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
