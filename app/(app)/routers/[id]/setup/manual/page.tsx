"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { CodeBlock } from "@/components/router-setup/CodeBlock";
import { SetupShell } from "@/components/router-setup/SetupShell";
import { apiGet, ConfigPreview } from "@/lib/router-setup";

export default function ManualPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [installCommand, setInstallCommand] = useState("");
  const [preview, setPreview] = useState<ConfigPreview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiGet<{ script: string }>(`/api/v1/routers/${id}/hotspot-install-command`),
      apiGet<ConfigPreview>(`/api/v1/routers/${id}/config-preview`)
    ])
      .then(([hotspotInstallData, previewData]) => {
        setInstallCommand(hotspotInstallData.script);
        setPreview(previewData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load manual scripts."));
  }, [id]);

  return (
    <SetupShell title="Manual Setup" description="Use these scripts when you prefer to configure the MikroTik manually through Winbox, WebFig, or Terminal." current="manual">
      <div className="space-y-6">
        {error ? <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink">Complete MikroTik Install Command</h2>
          <CodeBlock code={installCommand || "Loading..."} />
        </section>
        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink">RouterOS Configuration Script</h2>
          <CodeBlock code={preview?.script ?? "Loading..."} filename="noblifi-config.rsc" />
        </section>
        <section className="panel p-5">
          <h2 className="text-lg font-semibold text-ink">Instructions</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
            <li>Open MikroTik Winbox or WebFig.</li>
            <li>Open Terminal.</li>
            <li>Paste the complete MikroTik install command.</li>
            <li>Review the generated configuration script when you need to audit the HotSpot settings.</li>
          </ol>
        </section>
        <div className="flex flex-wrap gap-3">
          <Link href={`/routers/${id}/setup/method`} className="btn-secondary">
            Back
          </Link>
          <Link href={`/routers/${id}/setup/preview`} className="btn">
            Continue to Preview
          </Link>
        </div>
      </div>
    </SetupShell>
  );
}

