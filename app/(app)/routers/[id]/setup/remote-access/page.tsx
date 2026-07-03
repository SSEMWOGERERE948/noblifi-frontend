"use client";

import { FormEvent, use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CodeBlock } from "@/components/router-setup/CodeBlock";
import { SelectableCard } from "@/components/router-setup/SelectableCard";
import { SetupShell } from "@/components/router-setup/SetupShell";
import { apiGet, apiPost } from "@/lib/router-setup";

export default function RemoteAccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [method, setMethod] = useState<"bootstrap" | "direct_api">("bootstrap");
  const [host, setHost] = useState("192.168.88.1");
  const [apiPort, setApiPort] = useState("8728");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [bootstrapScript, setBootstrapScript] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiGet<{ script: string }>(`/api/v1/routers/${id}/bootstrap-script`)
      .then((data) => setBootstrapScript(data.script))
      .catch(() => setBootstrapScript(""));
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
      router.push(`/routers/${id}/setup/method`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save remote access method.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SetupShell title="Remote Access" description="Link the physical MikroTik first. RADIUS, NAT, bridge, and port configuration happens after this step." current="remote_access">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <SelectableCard
            title="Bootstrap Script"
            badge="Recommended"
            description="Paste a generated script into the MikroTik terminal. The router will securely phone home to NobliFi."
            selected={method === "bootstrap"}
            onSelect={() => setMethod("bootstrap")}
          />
          <SelectableCard
            title="Direct API Access"
            description="Connect directly to the MikroTik using RouterOS API credentials."
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
        ) : (
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">MikroTik Registration Script</h2>
              <p className="mt-1 text-sm text-muted">
                Paste this into the MikroTik terminal. It links the router to NobliFi and reports real RouterOS model, version, serial number, and interface details. It does not configure RADIUS/NAT/bridges yet.
              </p>
            </div>
            <CodeBlock code={bootstrapScript || "Loading bootstrap script..."} />
          </section>
        )}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Continue"}
        </button>
      </form>
    </SetupShell>
  );
}
