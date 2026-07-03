"use client";

import { FormEvent, use, useState } from "react";
import { useRouter } from "next/navigation";
import { SelectableCard } from "@/components/router-setup/SelectableCard";
import { SetupShell } from "@/components/router-setup/SetupShell";
import { apiPost } from "@/lib/router-setup";

export default function MethodPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [method, setMethod] = useState<"automatic" | "manual">("automatic");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await apiPost(`/api/v1/routers/${id}/setup/method`, { configuration_method: method });
      router.push(method === "automatic" ? `/routers/${id}/setup/topology` : `/routers/${id}/setup/manual`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save configuration method.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SetupShell title="Configuration Method" description="Choose whether NobliFi should generate a deployment topology or provide manual scripts." current="method">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <SelectableCard
            title="Automatic Deployment"
            badge="Recommended"
            description="Use the interactive Topology Designer to map ports, bridges, HotSpot, RADIUS, and PPPoE settings."
            selected={method === "automatic"}
            onSelect={() => setMethod("automatic")}
          />
          <SelectableCard
            title="Manual Setup"
            description="Configure services manually via Winbox, WebFig, or Terminal using generated NobliFi scripts."
            selected={method === "manual"}
            onSelect={() => setMethod("manual")}
          />
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Continue"}
        </button>
      </form>
    </SetupShell>
  );
}

