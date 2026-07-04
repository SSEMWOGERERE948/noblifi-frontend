"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { CodeBlock } from "@/components/router-setup/CodeBlock";
import { SetupShell } from "@/components/router-setup/SetupShell";
import { apiGet, apiPost, ConfigPreview } from "@/lib/router-setup";

const summaryLabels: Record<string, string> = {
  wan: "WAN",
  hotspot_lan: "HotSpot LAN",
  staff_lan: "Staff LAN",
  pos_lan: "POS LAN",
  cctv_lan: "CCTV LAN",
  disabled: "Disabled"
};

export default function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [preview, setPreview] = useState<ConfigPreview | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [installCommand, setInstallCommand] = useState("");

  useEffect(() => {
    Promise.all([
      apiGet<ConfigPreview>(`/api/v1/routers/${id}/config-preview`),
      apiGet<{ script: string }>(`/api/v1/routers/${id}/config-install-command`)
    ])
      .then(([previewData, commandData]) => {
        setPreview(previewData);
        setInstallCommand(commandData.script);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load preview."));
  }, [id]);

  async function deploy() {
    setDeploying(true);
    setError("");
    setSuccess("");
    try {
      const response = await apiPost<{ message: string; status: string }>(`/api/v1/routers/${id}/deploy`);
      setSuccess(`${response.message}. Download noblifi-config.rsc below and import it on the MikroTik to install RADIUS, NAT, bridges, DHCP, and HotSpot.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not queue deployment.");
    } finally {
      setDeploying(false);
    }
  }

  return (
    <SetupShell title="Config Preview" description="Review and download the RouterOS service setup script." current="preview">
      <div className="space-y-6">
        {error ? <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}
        {success ? <p className="rounded-md border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm font-semibold text-emerald-300">{success}</p> : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(summaryLabels).map(([key, label]) => (
            <div key={key} className="panel p-5">
              <p className="text-sm font-medium text-muted">{label}</p>
              <p className="mt-3 text-lg font-semibold text-ink">{preview?.summary[key]?.join(", ") || "None"}</p>
            </div>
          ))}
        </div>
        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink">Generated RouterOS Script</h2>
          <p className="mb-3 rounded-md border border-line bg-white/5 p-3 text-sm text-muted">Run this command in the MikroTik terminal to fetch <strong>noblifi-config.rsc</strong> from NobliFi and import it automatically. The imported script configures RADIUS, NAT, bridges, DHCP, and HotSpot.</p>
          <div className="mb-5">
            <CodeBlock code={installCommand || "Loading install command..."} />
          </div>
          <CodeBlock code={preview?.script ?? "Loading..."} filename="noblifi-config.rsc" />
        </section>
        <div className="flex flex-wrap gap-3">
          <Link href={`/routers/${id}/setup/topology`} className="btn-secondary">
            Back
          </Link>
          <Link href={`/routers/${id}/network-profile`} className="btn-secondary">
            Edit Network Profile
          </Link>
          <button type="button" className="btn" onClick={deploy} disabled={deploying}>
            {deploying ? "Queueing..." : "Mark Queued"}
          </button>
        </div>
      </div>
    </SetupShell>
  );
}


