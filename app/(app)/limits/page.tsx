import { PageHeader } from "@/components/PageHeader";
import { limits } from "@/lib/static-data";

export default function LimitsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Features and limits" description="Static account limit cards and request placeholders." />
      <div className="panel p-4 text-sm text-muted">Limits help protect accounts from fraud and capacity abuse. These values are static placeholders.</div>
      <section className="grid gap-5 lg:grid-cols-2">
        {limits.map((limit) => (
          <div key={limit.name} className="panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-ink">{limit.name} limit increase</h2>
                <p className="mt-3 text-sm text-muted">{limit.description}</p>
              </div>
              <span className="rounded-md bg-soft px-3 py-2 text-lg font-semibold text-ink">{limit.current}</span>
            </div>
            <button className="btn-secondary mt-5 w-full" type="button">Request increase to {limit.requested}</button>
          </div>
        ))}
      </section>
    </div>
  );
}
