import { DataTable, OperationsTitle, PageActions, StatusBadge } from "@/components/OperationsUI";

export default function SupportHubPage() {
  return (
    <>
      <OperationsTitle title="Support hub" description="Centralized support ticket queue for customer and network assistance." action={<PageActions label="New ticket" />} />
      <section className="panel p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Support tickets</h2>
            <p className="text-sm text-muted">3 total tickets</p>
          </div>
          <div className="flex gap-2">
            <input className="field w-full sm:w-72" placeholder="Search tickets..." />
            <button className="btn-secondary" type="button">Filter</button>
          </div>
        </div>
        <DataTable
          columns={["Ticket ID", "Subject", "Priority", "Status", "Created", "Action"]}
          rows={[
            { "Ticket ID": "SUP-2041", Subject: "Captive portal not opening", Priority: "High", Status: <StatusBadge label="Open" />, Created: "Aug 1, 2026 10:24 AM", Action: "Open" },
            { "Ticket ID": "SUP-2038", Subject: "Voucher batch sync check", Priority: "Medium", Status: <StatusBadge label="Waiting" />, Created: "Aug 1, 2026 09:41 AM", Action: "Open" },
            { "Ticket ID": "SUP-2032", Subject: "Router onboarding help", Priority: "Low", Status: <StatusBadge label="Closed" />, Created: "Aug 1, 2026 08:15 AM", Action: "Open" }
          ]}
        />
      </section>
    </>
  );
}
