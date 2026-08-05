import { PageHeader } from "@/components/PageHeader";
import { currency } from "@/lib/static-data";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Billing" description="Static billing summary for subscriptions, invoices, and payment method status." />
      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Plan", "Growth"],
          ["Next invoice", `${currency} 75,000`],
          ["Billing date", "Aug 30, 2026"]
        ].map(([label, value]) => (
          <div key={label} className="panel p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
