"use client";

import { FormEvent, use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CodeBlock } from "@/components/router-setup/CodeBlock";
import { SelectableCard } from "@/components/router-setup/SelectableCard";
import { SetupShell } from "@/components/router-setup/SetupShell";
import { ApiError, apiGet, apiPost, WireGuardSetup } from "@/lib/router-setup";

type RemoteAccessMethod = "wireguard" | "bootstrap" | "direct_api";

export default function RemoteAccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [method, setMethod] = useState<RemoteAccessMethod>("wireguard");
  const [host, setHost] = useState("192.168.88.1");
  const [apiPort, setApiPort] = useState("8728");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [bootstrapScript, setBootstrapScript] = useState("");
  const [wireGuard, setWireGuard] = useState<WireGuardSetup | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    let stopPolling = false;

    apiGet<{ script: string }>(`/api/v1/routers/${id}/bootstrap-script`)
      .then((data) => active && setBootstrapScript(data.script))
      .catch((err) => {
        if (!active) return;
        setBootstrapScript("");
        if (err instanceof ApiError && err.status === 404) {
          stopPolling = true;
          setError("Router not found. Return to Routers and open an existing router.");
        }
      });

    async function refreshWireGuard() {
      if (stopPolling) return;
      try {
        const setup = await apiGet<WireGuardSetup>(`/api/v1/routers/${id}/wireguard`);
        if (active) setWireGuard(setup);
      } catch (err) {
        if (!active) return;
        setWireGuard(null);
        if (err instanceof ApiError && err.status === 404) {
          stopPolling = true;
          setError("Router not found. Return to Routers and open an existing router.");
        }
      }
    }

    void refreshWireGuard();
    const poller = window.setInterval(refreshWireGuard, 5000);
    return () => {
      active = false;
      window.clearInterval(poller);
    };
  }, [id]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await apiPost(`/api/v1/routers/${id}/setup/remote-access`, {
        remote_access_method: method,
        host: method === "direct_api" ? host : undefined,
        api_port: method === "direct_api" ? Number(apiPort) : undefined,
        username: method === "direct_api" ? username : undefined,
        password: method === "direct_api" ? password : undefined
      });

      if (method === "wireguard") {
        const setup = await apiGet<WireGuardSetup>(`/api/v1/routers/${id}/wireguard`);
        setWireGuard(setup);
        return;
      }
      router.push(`/routers/${id}/setup/method`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save remote access method.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SetupShell
      title="Secure Remote Access"
      description="Connect the MikroTik to the NobliFi VPS before configuring ports, HotSpot, and RADIUS."
      current="remote_access"
    >
      <form onSubmit={submit} className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-3">
          <SelectableCard
            title="WireGuard VPS"
            badge="Recommended"
            description="Create a persistent management tunnel to the VPS. RADIUS and RouterOS management use private tunnel addresses."
            selected={method === "wireguard"}
            onSelect={() => setMethod("wireguard")}
          />
          <SelectableCard
            title="Bootstrap Only"
            description="Register the router and discover its real model, RouterOS version, and physical ports before service setup."
            selected={method === "bootstrap"}
            onSelect={() => setMethod("bootstrap")}
          />
          <SelectableCard
            title="Direct API Access"
            description="Connect directly to a reachable MikroTik RouterOS API endpoint."
            selected={method === "direct_api"}
            onSelect={() => setMethod("direct_api")}
          />
        </div>

        {method === "direct_api" ? (
          <div className="panel grid gap-4 p-5 md:grid-cols-2">
            <label className="text-sm font-medium text-ink">
              Host/IP
              <input className="field mt-2" value={host} onChange={(event) => setHost(event.target.value)} required />
            </label>
            <label className="text-sm font-medium text-ink">
              API Port
              <input className="field mt-2" value={apiPort} onChange={(event) => setApiPort(event.target.value)} required />
            </label>
            <label className="text-sm font-medium text-ink">
              Username
              <input className="field mt-2" value={username} onChange={(event) => setUsername(event.target.value)} required />
            </label>
            <label className="text-sm font-medium text-ink">
              Password
              <input className="field mt-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
          </div>
        ) : null}

        {method === "bootstrap" ? (
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">MikroTik Registration Script</h2>
              <p className="mt-1 text-sm text-muted">
                Run this first to report the real RouterOS model, version, serial number, and interfaces. It does not change bridge, WAN, DHCP, or HotSpot configuration.
              </p>
            </div>
            <CodeBlock code={bootstrapScript || "Loading bootstrap script..."} />
          </section>
        ) : null}

        {method === "wireguard" ? (
          <section className="space-y-5">
            {wireGuard?.issues.length ? (
              <div className="rounded-md border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-200">
                <p className="font-semibold">The VPS WireGuard environment is incomplete.</p>
                <ul className="mt-2 space-y-1">
                  {wireGuard.issues.map((issue) => <li key={issue}>{issue}</li>)}
                </ul>
                <div className="mt-4 space-y-3">
                  <p className="font-semibold">Set these on the backend after preparing the VPS:</p>
                  <CodeBlock
                    code={`NOBLIFI_WIREGUARD_ENABLED=true
NOBLIFI_WIREGUARD_ENDPOINT=<your-vps-public-ip-or-dns>
NOBLIFI_WIREGUARD_PORT=51820
NOBLIFI_WIREGUARD_PUBLIC_KEY=<public-key-printed-by-setup-wireguard-vps.sh>
NOBLIFI_WIREGUARD_INTERFACE=wg0
NOBLIFI_WIREGUARD_SERVER_IP=10.77.0.1
NOBLIFI_WIREGUARD_SUBNET=10.77.0.0/24
NOBLIFI_RADIUS_SERVER=10.77.0.1`}
                  />
                </div>
              </div>
            ) : null}

            {wireGuard?.ready ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="panel p-4">
                    <p className="text-xs font-semibold uppercase text-muted">VPS endpoint</p>
                    <p className="mt-2 font-semibold text-ink">{wireGuard.endpoint}:{wireGuard.endpoint_port}</p>
                  </div>
                  <div className="panel p-4">
                    <p className="text-xs font-semibold uppercase text-muted">VPS tunnel IP</p>
                    <p className="mt-2 font-semibold text-ink">{wireGuard.server_address}</p>
                  </div>
                  <div className="panel p-4">
                    <p className="text-xs font-semibold uppercase text-muted">Router tunnel IP</p>
                    <p className="mt-2 font-semibold text-ink">{wireGuard.router_address}</p>
                  </div>
                  <div className="panel p-4">
                    <p className="text-xs font-semibold uppercase text-muted">Status</p>
                    <p className="mt-2 font-semibold text-ink">{wireGuard.status.replaceAll("_", " ")}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h2 className="text-lg font-semibold text-ink">1. Install on the MikroTik</h2>
                    <p className="mt-1 text-sm text-muted">
                      RouterOS 7 only. This fetches an idempotent script and leaves WAN, physical ports, bridges, DHCP, and the default route unchanged.
                    </p>
                  </div>
                  <CodeBlock code={wireGuard.mikrotik_install_command} />
                  <CodeBlock code={wireGuard.mikrotik_script} filename="noblifi-wireguard.rsc" />
                </div>

                {wireGuard.router_public_key ? (
                  <div className="space-y-3">
                    <div>
                      <h2 className="text-lg font-semibold text-ink">2. Add this router peer on the VPS</h2>
                      <p className="mt-1 text-sm text-muted">
                        The MikroTik reported its public key. Run this on the VPS to activate the peer and persist it.
                      </p>
                    </div>
                    <CodeBlock code={wireGuard.vps_peer_command} />
                    <details className="panel p-4">
                      <summary className="cursor-pointer text-sm font-semibold text-ink">Manual wg0 peer block</summary>
                      <div className="mt-3"><CodeBlock code={wireGuard.vps_peer_config} /></div>
                    </details>
                    <div>
                      <h2 className="mb-3 text-lg font-semibold text-ink">3. Verify from the VPS</h2>
                      <CodeBlock code={wireGuard.verification_commands} />
                    </div>
                    <p className={`rounded-md border p-4 text-sm ${wireGuard.status === "connected" ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" : "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"}`}>
                      {wireGuard.status === "connected"
                        ? "WireGuard handshake verified. The VPS can reach this MikroTik over its private tunnel address."
                        : "Run the VPS peer command above. It pings the router and marks this tunnel connected only after the ping succeeds."}
                    </p>
                    <button
                      type="button"
                      className="btn"
                      disabled={wireGuard.status !== "connected"}
                      onClick={() => router.push(`/routers/${id}/setup/method`)}
                    >
                      Continue to service setup
                    </button>
                  </div>
                ) : (
                  <p className="rounded-md border border-cyan-300/30 bg-cyan-300/10 p-4 text-sm text-cyan-100">
                    Waiting for the MikroTik public key. Run the install command above; this page refreshes automatically.
                  </p>
                )}
              </>
            ) : null}
          </section>
        ) : null}

        {error ? <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}
        {method !== "wireguard" || !wireGuard?.ready ? (
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Saving..." : method === "wireguard" ? "Prepare WireGuard" : "Continue"}
          </button>
        ) : (
          <button className="btn-secondary" type="submit" disabled={submitting}>
            {submitting ? "Refreshing..." : "Regenerate WireGuard setup"}
          </button>
        )}
      </form>
    </SetupShell>
  );
}
