import { PageHeader } from "@/components/PageHeader";
import { currency } from "@/lib/static-data";

export default function FloatPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Float" description="Static preview of available balance and settlement movement." />
      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Available balance", `${currency} 221,900`],
          ["Pending settlement", `${currency} 86,400`],
          ["Last payout", `${currency} 145,000`]
        ].map(([label, value]) => (
          <div key={label} className="panel p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
          </div>
        ))}
      </section>
      <section className="panel p-5">
        <h2 className="text-xl font-semibold text-ink">Float requests</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <button className="btn" type="button">Top up float</button>
          <button className="btn-secondary" type="button">Request withdrawal</button>
        </div>
      </section>
    </div>
  );
}
