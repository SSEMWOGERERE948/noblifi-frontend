"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

import { BootstrapScript } from "@/components/BootstrapScript";
import { PageHeader } from "@/components/PageHeader";
import { apiFetch } from "@/lib/api";

type RouterDetail = {
  id: string;
  name: string;
  site_name?: string;
  expected_model?: string;
  model?: string;
  serial_number?: string;
  routeros_version?: string;
  status: string;
  health_status?: string;
  health_reason?: string;
  uptime?: string;
  cpu_load?: string;
  free_memory?: string;
  total_memory?: string;
  active_hotspot_users?: number;
  telemetry_updated_at?: string;
  telemetry_last_error?: string;
  wireguard_status?: string;
  wire_guard_peer_status?: string;
  wire_guard_last_handshake_at?: string;
  wire_guard_last_error?: string;
  remote_access_status?: string;
  remote_winbox_port?: number;
  remote_access_expires_at?: string;
  claim_token: string;
  config_status?: string;
  interfaces?: Array<{ name: string; type?: string; mac_address?: string; running: boolean; disabled: boolean }>;
  setup_session?: { current_step: string; remote_access_method?: string | null; configuration_method?: string | null };
  network_profile?: unknown;
};
type RouterRevenue = {
  currency: string;
  total_revenue: number;
  today_revenue: number;
  month_revenue: number;
  successful_payments: number;
};

export default function RouterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [router, setRouter] = useState<RouterDetail | null>(null);
  const [revenue, setRevenue] = useState<RouterRevenue | null>(null);
  const [error, setError] = useState("");
  const [winboxMessage, setWinboxMessage] = useState("");
  const [deleteChallenge, setDeleteChallenge] = useState<{ challenge_id: string; expected_confirmation: string; expires_at: string } | null>(null);
  const [confirmationOne, setConfirmationOne] = useState("");
  const [confirmationTwo, setConfirmationTwo] = useState("");

  function load() {
    Promise.all([
      apiFetch<RouterDetail>(`/api/v1/routers/${id}`),
      apiFetch<RouterRevenue>(`/api/v1/routers/${id}/revenue/summary`, {
        fallback: { currency: "UGX", total_revenue: 0, today_revenue: 0, month_revenue: 0, successful_payments: 0 }
      })
    ])
      .then(([routerData, revenueData]) => {
        setRouter(routerData);
        setRevenue(revenueData);
        setError("");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load router."));
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 15000);
    window.addEventListener("focus", load);
    window.addEventListener("online", load);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", load);
      window.removeEventListener("online", load);
    };
  }, [id]);

  if (error) {
    return <p className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</p>;
  }

  if (!router) {
    return <p className="text-sm text-muted">Loading router...</p>;
  }

  const interfaces = router.interfaces ?? [];
  const isLinked = Boolean(router.serial_number || router.model || router.routeros_version || interfaces.length || router.status === "online" || router.status === "linked" || router.status === "provisioned");
  const canEnableWinbox = ["online", "recovering", "degraded"].includes((router.health_status ?? "").toLowerCase());
  const winboxHost = typeof window !== "undefined" ? window.location.hostname : "access.noblifi.com";
  const winboxAddress = router.remote_winbox_port ? `${winboxHost}:${router.remote_winbox_port}` : "";

  async function enableWinbox(duration: number) {
    setWinboxMessage("");
    const response = await apiFetch<{ host: string; port: number; expires_at: string; status: string }>(`/api/v1/routers/${id}/remote-access/winbox`, {
      method: "POST",
      body: JSON.stringify({ duration_minutes: duration })
    });
    setWinboxMessage(`WinBox access ${response.status}. Connect to ${response.host}:${response.port}.`);
    load();
  }

  async function disableWinbox() {
    await apiFetch<void>(`/api/v1/routers/${id}/remote-access`, { method: "DELETE" });
    setWinboxMessage("WinBox remote access disabled.");
    load();
  }

  async function requestDeleteChallenge() {
    const response = await apiFetch<{ challenge_id: string; expected_confirmation: string; expires_at: string }>(`/api/v1/routers/${id}/delete-challenge`, {
      method: "POST"
    });
    setDeleteChallenge(response);
    setConfirmationOne("");
    setConfirmationTwo("");
  }

  async function deleteRouter() {
    if (!deleteChallenge) {
      return;
    }
    await apiFetch<void>(`/api/v1/routers/${id}`, {
      method: "DELETE",
      body: JSON.stringify({
        challenge_id: deleteChallenge.challenge_id,
        confirmation_one: confirmationOne,
        confirmation_two: confirmationTwo
      })
    });
    window.location.href = "/routers";
  }

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
              ["Status", titleCase(router.health_status ?? router.status)],
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
          <h2 className="text-lg font-semibold text-ink">Live Health</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            {[
              ["Health", titleCase(router.health_status ?? router.status)],
              ["Reason", label(router.health_reason ?? "-")],
              ["CPU Load", formatCpu(router.cpu_load)],
              ["Uptime", formatUptime(router.uptime)],
              ["Active HotSpot Users", String(router.active_hotspot_users ?? "--")],
              ["Memory", formatMemory(router.free_memory, router.total_memory)],
              ["Last Telemetry", formatDateTime(router.telemetry_updated_at)],
              ["Telemetry Error", router.telemetry_last_error ?? "-"],
              ["WireGuard", router.wireguard_status || router.wire_guard_peer_status || "-"],
              ["Last Handshake", formatDateTime(router.wire_guard_last_handshake_at)],
              ["WireGuard Error", router.wire_guard_last_error ?? "-"]
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-line pb-2">
                <dt className="text-muted">{label}</dt>
                <dd className="font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="panel p-5">
          <h2 className="text-lg font-semibold text-ink">WinBox Remote Access</h2>
          {winboxMessage ? <p className="mt-3 rounded-md border border-line bg-soft p-3 text-sm text-accent">{winboxMessage}</p> : null}
          <dl className="mt-4 grid gap-3 text-sm">
            {[
              ["Status", titleCase(router.remote_access_status ?? "disabled")],
              ["Connect To", winboxAddress || "-"],
              ["Expires", formatDateTime(router.remote_access_expires_at)]
            ].map(([labelText, value]) => (
              <div key={labelText} className="flex justify-between gap-4 border-b border-line pb-2">
                <dt className="text-muted">{labelText}</dt>
                <dd className="font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            {[15, 30, 60].map((duration) => (
              <button key={duration} className="btn-secondary" type="button" disabled={!canEnableWinbox} onClick={() => enableWinbox(duration)}>
                Enable {duration}m
              </button>
            ))}
            <button className="btn-secondary" type="button" onClick={disableWinbox}>
              Disable Access
            </button>
            {winboxAddress ? (
              <button className="btn" type="button" onClick={() => navigator.clipboard.writeText(winboxAddress)}>
                Copy Address
              </button>
            ) : null}
          </div>
        </div>
        <div className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink">Online Sales</h2>
            <Link className="btn-secondary" href={`/sales?router_id=${id}`}>
              View all sales
            </Link>
          </div>
          <dl className="mt-4 grid gap-3 text-sm">
            {[
              ["Today", formatMoney(revenue?.today_revenue ?? 0, revenue?.currency ?? "UGX")],
              ["This Month", formatMoney(revenue?.month_revenue ?? 0, revenue?.currency ?? "UGX")],
              ["Total", formatMoney(revenue?.total_revenue ?? 0, revenue?.currency ?? "UGX")],
              ["Customers", `${revenue?.successful_payments ?? 0} successful purchases`]
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
      <section className="panel mt-6 p-5">
        <h2 className="text-lg font-semibold text-red-300">Danger Zone</h2>
        <p className="mt-2 text-sm text-muted">Deleting a router disables runtime management and removes WireGuard access, but preserves sales, vouchers, wallet, commission, and accounting history.</p>
        {!deleteChallenge ? (
          <button className="btn-secondary mt-4" type="button" onClick={requestDeleteChallenge}>
            Delete Router
          </button>
        ) : (
          <div className="mt-4 grid gap-3">
            <pre className="overflow-x-auto rounded-md border border-line bg-soft p-3 text-sm text-ink">{deleteChallenge.expected_confirmation}</pre>
            <textarea className="field min-h-24" value={confirmationOne} onChange={(event) => setConfirmationOne(event.target.value)} placeholder="Paste confirmation once" />
            <textarea className="field min-h-24" value={confirmationTwo} onChange={(event) => setConfirmationTwo(event.target.value)} placeholder="Paste confirmation again" />
            <button className="btn" type="button" onClick={deleteRouter}>
              Confirm Delete Router
            </button>
          </div>
        )}
      </section>
      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-ink">Registration Script</h2>
        <BootstrapScript token={router.claim_token} />
      </section>
    </>
  );
}

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "Pending";
}

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatCpu(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return "--";
  }
  return trimmed.endsWith("%") ? trimmed : `${trimmed}%`;
}

function formatUptime(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return "Telemetry pending";
  }
  return trimmed.replace(/(\d+)([wdhms])/g, "$1$2 ").trim();
}

function formatMemory(free?: string, total?: string) {
  if (!free && !total) {
    return "--";
  }
  return `${free ?? "?"} / ${total ?? "?"}`;
}

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString();
}

function formatMoney(value: number, currency: string) {
  return `${currency} ${new Intl.NumberFormat("en-UG").format(value || 0)}`;
}
