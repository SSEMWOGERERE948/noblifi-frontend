import { PageHeader } from "@/components/PageHeader";

export default function SMSPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="SMS" description="Static SMS sender setup and notification preview." />
      <section className="panel p-5">
        <h2 className="text-xl font-semibold text-ink">Message templates</h2>
        <div className="mt-4 divide-y divide-line text-sm">
          {["Voucher delivery", "Payment receipt", "Support update"].map((item) => (
            <div key={item} className="flex justify-between py-3">
              <span className="font-medium text-ink">{item}</span>
              <span className="text-muted">Enabled</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
