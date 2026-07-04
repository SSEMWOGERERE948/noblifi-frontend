"use client";

import { FormEvent, use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SetupShell } from "@/components/router-setup/SetupShell";
import { apiGet, apiPut, InterfaceInfo } from "@/lib/router-setup";

const roles = ["WAN", "HOTSPOT_LAN", "STAFF_LAN", "POS_LAN", "CCTV_LAN", "DISABLED"];

function isAssignableInterface(iface: InterfaceInfo) {
  const type = (iface.type ?? "").toLowerCase();
  const name = iface.name.toLowerCase();
  if (type.includes("bridge") || name.includes("bridge") || name.startsWith("br-")) return false;
  if (type.includes("loopback") || type.includes("tunnel")) return false;
  return true;
}

export default function TopologyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [interfaces, setInterfaces] = useState<InterfaceInfo[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiGet<{ interfaces: InterfaceInfo[] }>(`/api/v1/routers/${id}/interfaces`)
      .then((data) => {
        const next = data.interfaces.filter(isAssignableInterface);
        setInterfaces(next);
        setAssignments(() => {
          const seeded: Record<string, string> = {};
          next.forEach((iface, index) => {
            seeded[iface.name] = index === 0 ? "WAN" : "HOTSPOT_LAN";
          });
          return seeded;
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load MikroTik interfaces."))
      .finally(() => setLoading(false));
  }, [id]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await apiPut(`/api/v1/routers/${id}/port-assignments`, {
        assignments: interfaces.map((iface) => ({ interface: iface.name, role: assignments[iface.name] ?? "DISABLED" }))
      });
      router.push(`/routers/${id}/setup/preview`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save assignments.");
    } finally {
      setSubmitting(false);
    }
  }

  function validate() {
    if (!interfaces.length) return "No MikroTik interfaces have been discovered yet. Link the router first from the Remote Access step.";
    const names = new Set<string>();
    let wan = 0;
    let hotspot = 0;
    for (const iface of interfaces) {
      const role = assignments[iface.name];
      if (names.has(iface.name)) return `Duplicate interface ${iface.name}.`;
      names.add(iface.name);
      if (!roles.includes(role)) return `Unknown role ${role} for ${iface.name}.`;
      if (iface.disabled && (role === "WAN" || role === "HOTSPOT_LAN")) return `${iface.name} is disabled and cannot be used for ${role}.`;
      if (role === "WAN") wan++;
      if (role === "HOTSPOT_LAN") hotspot++;
    }
    if (wan !== 1) return "Exactly one WAN interface is required.";
    if (hotspot < 1) return "At least one HOTSPOT_LAN interface is required.";
    return "";
  }

  return (
    <SetupShell title="Automatic Topology Setup" description="Assign each MikroTik interface to a NobliFi network role." current="topology">
      <form onSubmit={submit} className="space-y-5">
        {loading ? <p className="text-sm text-muted">Loading interfaces...</p> : null}
        {!loading && !interfaces.length ? (
          <p className="rounded-md border border-line bg-white/5 p-4 text-sm text-muted">
            No assignable MikroTik ports were discovered. If this router is linked, refresh after the bootstrap script reports ether interfaces.
          </p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {interfaces.map((iface) => (
            <div key={iface.name} className="panel p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-ink">{iface.name}</h3>
                  <p className="text-sm text-muted">{iface.type ?? "ethernet"} - {iface.running ? "running" : "down"}</p>
                </div>
                {iface.disabled ? <span className="rounded-full bg-red-500/15 px-2 py-1 text-xs font-semibold text-red-300">Disabled</span> : null}
              </div>
              <select
                className="field"
                value={assignments[iface.name] ?? "DISABLED"}
                onChange={(event) => setAssignments((current) => ({ ...current, [iface.name]: event.target.value }))}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        {error ? <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save and Preview"}
        </button>
      </form>
    </SetupShell>
  );
}

