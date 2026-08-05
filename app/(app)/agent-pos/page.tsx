import { PageHeader } from "@/components/PageHeader";
import { currency } from "@/lib/static-data";

export default function AgentPOSPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Agent POS" description="Static agent sales and voucher issuing workspace." action={<button className="btn">Add agent</button>} />
      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Active agents", "14"],
          ["Today sales", `${currency} 92,000`],
          ["Printed vouchers", "188"]
        ].map(([label, value]) => (
          <div key={label} className="panel p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
