import { PageHeader } from "@/components/PageHeader";

const tickets = [
  ["SUP-2041", "Captive portal not opening", "High", "Open"],
  ["SUP-2038", "Voucher batch sync check", "Medium", "Waiting"],
  ["SUP-2032", "Router onboarding help", "Low", "Closed"]
];

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Support hub" description="Static ticket queue for customer and network support." action={<button className="btn">New ticket</button>} />
      <section className="panel divide-y divide-line">
        {tickets.map(([id, subject, priority, status]) => (
          <div key={id} className="grid gap-3 p-4 text-sm md:grid-cols-4">
            <span className="font-semibold text-ink">{id}</span>
            <span className="text-muted md:col-span-1">{subject}</span>
            <span className="text-muted">{priority}</span>
            <span className="text-muted">{status}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
