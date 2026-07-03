"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { CodeBlock } from "@/components/router-setup/CodeBlock";
import { SetupShell } from "@/components/router-setup/SetupShell";
import { apiGet, ConfigPreview } from "@/lib/router-setup";

export default function ManualPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [bootstrap, setBootstrap] = useState("");
  const [preview, setPreview] = useState<ConfigPreview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiGet<{ script: string }>(`/api/v1/routers/${id}/bootstrap-script`),
      apiGet<ConfigPreview>(`/api/v1/routers/${id}/config-preview`)
    ])
      .then(([bootstrapData, previewData]) => {
        setBootstrap(bootstrapData.script);
        setPreview(previewData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load manual scripts."));
  }, [id]);

  return (
    <SetupShell title="Manual Setup" description="Use these scripts when you prefer to configure the MikroTik manually through Winbox, WebFig, or Terminal." current="manual">
      <div className="space-y-6">
        {error ? <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink">Bootstrap Script</h2>
          <CodeBlock code={bootstrap || "Loading..."} />
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
            <li>Paste the bootstrap script.</li>
            <li>Wait for the router to check in.</li>
            <li>Paste the configuration script if manual setup is preferred.</li>
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

