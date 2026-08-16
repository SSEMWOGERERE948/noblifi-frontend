"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { API_BASE_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";

type RouterRow = {
  id: string;
  name: string;
  site_name?: string | null;
  model?: string | null;
  expected_model?: string | null;
  routeros_version?: string | null;
  management_ip?: string | null;
  wireguard_tunnel_ip?: string | null;
  wireguard_status?: string;
  status: string;
  last_seen_at?: string | null;
  uptime?: string | null;
  cpu_load?: string | null;
  free_memory?: string | null;
  total_memory?: string | null;
  active_hotspot_users?: number | null;
  telemetry_updated_at?: string | null;
  telemetry_last_error?: string | null;
};

type RemoteAccess = {
  address: string;
  api_address: string;
  winbox_address: string;
  web_url: string;
  secure_web_url: string;
  method: string;
  ready: boolean;
};

export default function RoutersPage() {
  const [routers, setRouters] = useState<RouterRow[]>([]);
  const [menuRouterId, setMenuRouterId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRouters();
  }, []);

  async function loadRouters() {
    setLoading(true);
    const response = await authedFetch("/api/v1/routers");
    if (!response.ok) {
      setMessage("Could not load routers for this account.");
      setLoading(false);
      return;
    }
    setRouters(await response.json());
    setLoading(false);
  }

  async function remote(router: RouterRow, action: "copy" | "web") {
    const response = await authedFetch(`/api/v1/routers/${router.id}/remote-access`);
    if (!response.ok) {
      setMessage(await readError(response, "Remote access is not ready."));
      return;
    }
    const details = (await response.json()) as RemoteAccess;
    if (action === "copy") {
      await navigator.clipboard.writeText(details.winbox_address);
      setMessage(`Copied remote Winbox address for ${router.name}: ${details.winbox_address}`);
      return;
    }
    window.open(details.web_url, "_blank", "noopener,noreferrer");
  }

  async function enableRemote(router: RouterRow) {
    setMessage(`Enabling VPN remote access for ${router.name}...`);
    const response = await authedFetch(`/api/v1/routers/${router.id}/remote-access/enable`, { method: "POST" });
    if (!response.ok) {
      setMessage(await readError(response, "Could not enable VPN remote access."));
      return;
    }
    const details = (await response.json()) as RemoteAccess;
    setMessage(`VPN remote access queued. WebFig URL: ${details.web_url}`);
    loadRouters();
  }

  async function testConnection(router: RouterRow) {
    setMessage(`Testing ${router.name}...`);
    const response = await authedFetch(`/api/v1/routers/${router.id}/test-connection`, { method: "POST" });
    setMessage(response.ok ? `Connection to ${router.name} succeeded.` : await readError(response, "Connection test failed."));
  }

  async function rename(router: RouterRow) {
    const name = window.prompt("New router name", router.name);
    if (!name) return;
    const response = await authedFetch(`/api/v1/routers/${router.id}/rename`, {
      method: "POST",
      body: JSON.stringify({ name })
    });
    setMessage(response.ok ? "Router renamed." : await readError(response, "Could not rename router."));
    loadRouters();
  }

  async function updatePassword(router: RouterRow) {
    const password = window.prompt("New router admin/API password");
    if (!password) return;
    const response = await authedFetch(`/api/v1/routers/${router.id}/admin-password`, {
      method: "POST",
      body: JSON.stringify({ password })
    });
    setMessage(response.ok ? "Router admin password updated." : await readError(response, "Could not update password."));
  }

  async function reboot(router: RouterRow) {
    if (!window.confirm(`Reboot ${router.name}? Connected users may be disconnected.`)) return;
    const response = await authedFetch(`/api/v1/routers/${router.id}/reboot`, { method: "POST" });
    setMessage(response.ok ? "Reboot command sent." : await readError(response, "Could not reboot router."));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Routers"
        description="Manage your network infrastructure, review scheduled router telemetry, and open remote access."
        action={<Link href="/routers/new" className="btn">Add Router</Link>}
      />
      {message ? <div className="panel p-4 text-sm text-muted">{message}</div> : null}

      <section className="panel overflow-visible">
        {loading ? (
          <div className="p-6 text-sm text-muted">Loading routers...</div>
        ) : routers.length ? (
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-line bg-soft text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Router</th>
                <th className="px-4 py-3">Model / Version</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">CPU Load</th>
                <th className="px-4 py-3">Uptime</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {routers.map((router) => {
                const address = router.wireguard_tunnel_ip || router.management_ip || "No remote address";
                const updated = telemetryFreshness(router);
                return (
                  <tr key={router.id}>
                    <td className="px-4 py-4">
                      <Link href={`/routers/${router.id}`} className="font-semibold text-ink">{router.name}</Link>
                      <p className="text-xs text-muted">{address}</p>
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {router.model || router.expected_model || "Pending"}
                      <br />
                      {router.routeros_version || "Version pending"}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        {router.status || "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {router.cpu_load ? `${router.cpu_load}%` : "Pending"}
                      <TelemetryHint router={router} updated={updated} />
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {router.uptime || "Pending"}
                      <TelemetryHint router={router} updated={updated} />
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {typeof router.active_hotspot_users === "number" ? router.active_hotspot_users : "Pending"}
                      <TelemetryHint router={router} updated={updated} />
                    </td>
                    <td className="relative px-4 py-4 text-right">
                      <button className="btn-secondary px-3" type="button" onClick={() => setMenuRouterId(menuRouterId === router.id ? null : router.id)}>
                        More
                      </button>
                      {menuRouterId === router.id ? (
                        <div className="absolute right-4 z-20 mt-2 w-64 overflow-hidden rounded-md border border-line bg-panel text-left shadow-xl">
                          <Link href={`/routers/${router.id}`} className="block w-full px-4 py-3 text-left text-sm text-ink hover:bg-soft">Open router settings</Link>
                          <button className="block w-full px-4 py-3 text-left text-sm text-ink hover:bg-soft" type="button" onClick={() => rename(router)}>Rename</button>
                          <div className="border-t border-line px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted">Remote access</div>
                          <button className="block w-full px-4 py-3 text-left text-sm text-ink hover:bg-soft" type="button" onClick={() => remote(router, "copy")}>Copy Winbox address</button>
                          <button className="block w-full px-4 py-3 text-left text-sm text-ink hover:bg-soft" type="button" onClick={() => enableRemote(router)}>Enable VPN access</button>
                          <button className="block w-full px-4 py-3 text-left text-sm text-ink hover:bg-soft" type="button" onClick={() => remote(router, "web")}>Open WebFig</button>
                          <button className="block w-full px-4 py-3 text-left text-sm text-ink hover:bg-soft" type="button" onClick={() => testConnection(router)}>Test connection</button>
                          <button className="block w-full px-4 py-3 text-left text-sm text-ink hover:bg-soft" type="button" onClick={() => updatePassword(router)}>Update admin password</button>
                          <button className="block w-full px-4 py-3 text-left text-sm text-yellow-300 hover:bg-soft" type="button" onClick={() => reboot(router)}>Reboot router</button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-sm text-muted">No routers have been created yet.</div>
        )}
      </section>
    </div>
  );
}

function TelemetryHint({ router, updated }: { router: RouterRow; updated: string }) {
  if (router.telemetry_last_error) {
    if (isWireGuardRouter(router) && isAppEngineTunnelError(router.telemetry_last_error) && !router.telemetry_updated_at) {
      return <p className="mt-1 max-w-[180px] truncate text-xs text-muted/70" title="Telemetry will update after the VPS agent scheduler posts a router snapshot.">Waiting for agent</p>;
    }
    return <p className="mt-1 max-w-[180px] truncate text-xs text-yellow-300" title={router.telemetry_last_error}>Last update failed</p>;
  }
  if (!updated) return null;
  return <p className="mt-1 text-xs text-muted/70">{updated}</p>;
}

function isWireGuardRouter(router: RouterRow) {
  return Boolean(router.wireguard_tunnel_ip || router.management_ip?.startsWith("10.77."));
}

function isAppEngineTunnelError(error: string) {
  return error.includes("10.77.") && (error.includes("i/o timeout") || error.includes("timed out"));
}

function telemetryFreshness(router: RouterRow) {
  if (!router.telemetry_updated_at) return "";
  const timestamp = new Date(router.telemetry_updated_at).getTime();
  if (!Number.isFinite(timestamp)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "updated now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `updated ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `updated ${hours}h ago`;
  return `updated ${Math.floor(hours / 24)}d ago`;
}

async function authedFetch(path: string, init: RequestInit = {}) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken() || ""}`,
      ...init.headers
    },
    cache: "no-store"
  });
}

async function readError(response: Response, fallback: string) {
  const text = await response.text();
  if (!text) return fallback;
  try {
    const body = JSON.parse(text);
    return body.message || body.error || text;
  } catch {
    return text;
  }
}
