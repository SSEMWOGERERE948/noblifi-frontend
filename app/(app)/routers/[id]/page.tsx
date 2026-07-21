import Link from "next/link";

import { BootstrapScript } from "@/components/BootstrapScript";
import { PageHeader } from "@/components/PageHeader";
import { apiFetch } from "@/lib/api";

export const dynamic = "force-dynamic";

type RouterDetail = {
  id: string;
  name: string;
  site_name?: string;
  expected_model?: string;
  model?: string;
  serial_number?: string;
  routeros_version?: string;
  management_ip?: string;
  wireguard_tunnel_ip?: string;
  wireguard_status?: string;
  status: string;
  claim_token: string;
  config_status?: string;
  interfaces?: Array<{ name: string; type?: string; mac_address?: string; running: boolean; disabled: boolean }>;
  setup_session?: { current_step: string; remote_access_method?: string | null; configuration_method?: string | null };
  network_profile?: unknown;
};

export default async function RouterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const router = await apiFetch<RouterDetail>(`/api/v1/routers/${id}`);
  const interfaces = router.interfaces ?? [];
  const isLinked = Boolean(router.serial_number || router.model || router.routeros_version || interfaces.length || router.status === "online" || router.status === "linked" || router.status === "provisioned");

  return (
    <>
      <PageHeader
        title={router.name}
        description="Create the router first, link the physical MikroTik, then choose automatic or manual RADIUS setup."
        action={
          <div className="flex flex-wrap gap-2">
            <Link className="btn" href={`/routers/${id}/setup/remote-access`}>
              {isLinked ? "Remote Access" : "Link MikroTik"}
            </Link>
            <Link className="btn-secondary" href={`/routers/${id}/setup/method`}>
              Choose Setup Method
            </Link>
            <Link className="btn-secondary" href={`/routers/${id}/ports`}>
              Configure Ports
            </Link>
            <Link className="btn-secondary" href={`/routers/${id}/network-profile`}>
              Network Profile
            </Link>
          </div>
        }
      />
      <section className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <div className="panel p-5">
          <h2 className="text-lg font-semibold text-ink">Router Info</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            {[
              ["Site", router.site_name ?? "-"],
              ["Expected Model", router.expected_model ?? "-"],
              ["Detected Model", router.model ?? "Not linked yet"],
              ["Serial Number", router.serial_number ?? "Not linked yet"],
              ["RouterOS", router.routeros_version ?? "Not linked yet"],
              ["Management IP", router.management_ip ?? "Not connected"],
              ["WireGuard IP", router.wireguard_tunnel_ip ?? "Not prepared"],
              ["WireGuard", (router.wireguard_status ?? "disabled").replaceAll("_", " ")],
              ["Status", router.status],
              ["Claim Token", router.claim_token],
              ["Setup Step", router.setup_session?.current_step ?? "Not started"],
              ["Configuration", router.config_status ?? "Pending"]
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-line pb-2">
                <dt className="text-muted">{label}</dt>
                <dd className="font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink">MikroTik Interfaces</h2>
            <Link className="btn-secondary" href={`/routers/${id}/setup/remote-access`}>
              Refresh by Check-in
            </Link>
          </div>
          <div className="mt-4 grid gap-2">
            {interfaces.length ? (
              interfaces.map((iface) => (
                <div key={iface.name} className="rounded-md border border-line px-3 py-2 text-sm">
                  <span className="font-medium text-ink">{iface.name}</span>
                  <span className="ml-2 text-muted">{iface.type ?? "unknown"}</span>
                  {iface.mac_address ? <span className="ml-2 text-muted">{iface.mac_address}</span> : null}
                  <span className="ml-2 text-muted">{iface.running ? "running" : "down"}</span>
                  {iface.disabled ? <span className="ml-2 text-red-300">disabled</span> : null}
                </div>
              ))
            ) : (
              <p className="rounded-md border border-line bg-white/5 p-3 text-sm text-muted">
                No MikroTik interfaces have been discovered yet. Open Link MikroTik, paste the registration script into RouterOS, then refresh this page.
              </p>
            )}
          </div>
        </div>
      </section>
      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-ink">Registration Script</h2>
        <BootstrapScript token={router.claim_token} />
      </section>
    </>
  );
}
