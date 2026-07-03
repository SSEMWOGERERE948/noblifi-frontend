import Link from "next/link";

import { PageHeader } from "@/components/PageHeader";
import { apiFetch } from "@/lib/api";

export const dynamic = "force-dynamic";

type RouterRow = {
  id: string;
  name: string;
  site_name?: string;
  model?: string;
  expected_model?: string;
  routeros_version?: string;
  serial_number?: string;
  status: string;
  last_seen_at?: string;
};

export default async function RoutersPage() {
  const routers = await apiFetch<RouterRow[]>("/api/v1/routers");

  return (
    <>
      <PageHeader
        title="Routers"
        description="Create router records, link MikroTik devices, then provision RADIUS, NAT, bridges, and ports."
        action={
          <Link href="/routers/new" className="btn">
            Add Router
          </Link>
        }
      />
      <div className="panel overflow-hidden">
        {routers.length ? (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line bg-soft text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Router</th>
                <th className="px-4 py-3">Model / Version</th>
                <th className="px-4 py-3">Serial</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Seen</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {routers.map((router) => (
                <tr key={router.id} className="hover:bg-soft">
                  <td className="px-4 py-3 font-medium text-ink">
                    <Link href={`/routers/${router.id}`}>
                      <span className="block">{router.name}</span>
                      <span className="text-xs font-normal text-muted">{router.site_name ?? "No site"}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    <span className="block">{router.model ?? router.expected_model ?? "Not linked"}</span>
                    <span className="text-xs">{router.routeros_version ?? "Version pending"}</span>
                  </td>
                  <td className="px-4 py-3 text-muted">{router.serial_number ?? "Not linked"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-line bg-soft px-2 py-1 text-xs font-semibold text-ink">
                      {titleCase(router.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{router.last_seen_at ? new Date(router.last_seen_at).toLocaleString() : "Never"}</td>
                  <td className="px-4 py-3 text-muted">
                    <Link href={`/routers/${router.id}`} className="font-semibold text-brand">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-sm text-muted">
            No routers have been created yet. Add a router to generate a claim token, then open it to link the physical MikroTik.
          </div>
        )}
      </div>
    </>
  );
}

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "Pending";
}