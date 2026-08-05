import { PageHeader } from "@/components/PageHeader";
import { currency, salesRows } from "@/lib/static-data";

export default function SalesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales"
        description="Static voucher and payment sales register."
        action={<button className="btn-secondary" type="button">Pick sale date</button>}
      />

      <section className="panel p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input className="field w-full sm:w-80" placeholder="Search by code, phone, name, transaction" />
            <button className="btn-secondary" type="button">Package</button>
            <button className="btn-secondary" type="button">Sold by</button>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary" type="button">Export</button>
            <button className="btn-secondary" type="button">View</button>
          </div>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-line bg-soft text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Voucher code</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Package</th>
              <th className="px-4 py-3">Payer</th>
              <th className="px-4 py-3">Payer name</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Created on</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {salesRows.map((sale) => (
              <tr key={sale.code}>
                <td className="px-4 py-4 font-mono font-semibold text-ink">{sale.code}</td>
                <td className="px-4 py-4 text-muted">{sale.channel}</td>
                <td className="px-4 py-4 text-muted">{sale.package}</td>
                <td className="px-4 py-4 text-muted">{sale.payer || "-"}</td>
                <td className="px-4 py-4 text-muted">{sale.name}</td>
                <td className="px-4 py-4 font-semibold text-ink">{currency} {sale.amount.toLocaleString()}</td>
                <td className="px-4 py-4 text-muted">{sale.created}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
