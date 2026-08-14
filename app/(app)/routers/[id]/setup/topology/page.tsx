"use client";

import { FormEvent, use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SetupShell } from "@/components/router-setup/SetupShell";
import { apiGet, apiPut, InterfaceInfo } from "@/lib/router-setup";

const roles = ["WAN", "HOTSPOT_LAN", "STAFF_LAN", "POS_LAN", "CCTV_LAN", "DISABLED"];

const roleLabels: Record<string, string> = {
  WAN: "WAN",
  HOTSPOT_LAN: "Hotspot",
  STAFF_LAN: "Staff",
  POS_LAN: "POS",
  CCTV_LAN: "CCTV",
  DISABLED: "Disabled"
};

const bridgeRoles = ["HOTSPOT_LAN", "STAFF_LAN", "POS_LAN", "CCTV_LAN"];

type NetworkProfile = {
  hotspot_gateway?: string;
  staff_gateway?: string;
  pos_gateway?: string;
  cctv_gateway?: string;
};

export default function TopologyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [interfaces, setInterfaces] = useState<InterfaceInfo[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState<NetworkProfile | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      apiGet<{ interfaces: InterfaceInfo[] }>(`/api/v1/routers/${id}/interfaces`),
      apiGet<NetworkProfile>(`/api/v1/routers/${id}/network-profile`).catch(() => null)
    ])
      .then(([data, profileData]) => {
        const next = data.interfaces;
        setInterfaces(next);
        setProfile(profileData);
        setAssignments((current) => {
          const seeded = { ...current };
          next.forEach((iface, index) => {
            if (!seeded[iface.name]) {
              seeded[iface.name] = index === 0 ? "WAN" : index < 3 ? "HOTSPOT_LAN" : "DISABLED";
            }
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
            No real MikroTik interfaces have been discovered for this router yet. Go back to Remote Access, run the registration script on the MikroTik, then return here.
          </p>
        ) : null}
        {interfaces.length ? (
          <div className="overflow-hidden rounded-lg border border-line bg-[#070d1a]">
            <div className="grid lg:grid-cols-[260px_1fr]">
              <aside className="border-b border-line bg-panel/70 p-5 lg:border-b-0 lg:border-r">
                <button className="mb-8 flex items-center gap-3 text-sm font-semibold text-ink" type="button">
                  <span className="text-2xl leading-none text-muted">+</span>
                  Add Bridge
                </button>
                <div className="flex items-center gap-3 text-sm font-semibold text-ink">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-muted">LB</span>
                  Load Balancer
                  <span className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase text-amber-300">Beta</span>
                </div>
              </aside>
              <section
                className="relative min-h-[460px] overflow-x-auto p-6"
                style={{
                  backgroundImage: "radial-gradient(circle, rgba(148, 163, 184, 0.34) 1px, transparent 1px)",
                  backgroundSize: "14px 14px"
                }}
              >
                <div className="mx-auto mt-20 w-max min-w-[760px]">
                  <div className="rounded-lg border border-line bg-[#090f1f] shadow-2xl">
                    <div className="flex items-center justify-between border-b border-line px-4 py-3">
                      <div className="flex items-center gap-3 text-xs text-muted">
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-black/30 text-accent">R</span>
                        <span className="font-semibold text-ink">MikroTik Router</span>
                        <span>{interfaces.length} discovered ports</span>
                      </div>
                      <p className="text-xs text-cyan-200">Choose a role on each port to connect it to a bridge</p>
                    </div>
                    <div className="flex gap-3 overflow-x-auto p-4">
                      {interfaces.map((iface, index) => {
                        const role = assignments[iface.name] ?? "DISABLED";
                        return (
                          <div key={iface.name} className={`w-28 shrink-0 rounded-md border p-3 text-center ${role === "WAN" ? "border-amber-500/50 bg-amber-500/10" : role === "DISABLED" ? "border-line bg-soft/60" : "border-accent/40 bg-emerald-400/10"}`}>
                            {role !== "DISABLED" ? <div className="mb-1 text-[10px] font-bold uppercase text-accent">{roleLabels[role]}</div> : <div className="mb-1 text-[10px] uppercase text-muted">Port</div>}
                            <div className="mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded border border-emerald-400/40 text-accent">P</div>
                            <p className="truncate text-xs font-semibold text-ink">{iface.name || `port-${index + 1}`}</p>
                            <p className="text-[11px] text-muted">{iface.running ? "running" : "down"}</p>
                            {iface.disabled ? <p className="mt-1 text-[10px] font-semibold text-red-300">disabled</p> : null}
                            <select
                              className="field mt-3 px-2 py-1 text-xs"
                              value={role}
                              onChange={(event) => setAssignments((current) => ({ ...current, [iface.name]: event.target.value }))}
                            >
                              {roles.map((roleOption) => (
                                <option key={roleOption} value={roleOption}>
                                  {roleOption}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-[-18px] grid gap-4 px-6 md:grid-cols-2 xl:grid-cols-4">
                    {bridgeRoles.map((role) => {
                      const assigned = interfaces.filter((iface) => assignments[iface.name] === role);
                      return (
                        <div key={role} className="rounded-lg border border-line bg-panel p-4 shadow-xl">
                          <div className="mb-4 flex items-center gap-2">
                            <span className="text-accent">BR</span>
                            <h3 className="font-semibold text-ink">{role.replace("_LAN", "-BRIDGE")}</h3>
                          </div>
                          <div className="space-y-3 text-xs">
                            <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
                              <span className="text-muted">Gateway</span>
                              <span className="rounded bg-soft px-2 py-1 font-mono text-ink">{gatewayFor(role, profile)}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span className={`rounded-full px-3 py-1 font-semibold ${role === "HOTSPOT_LAN" ? "bg-emerald-400 text-slate-950" : "border border-line text-muted"}`}>
                                {role === "HOTSPOT_LAN" ? "Hotspot" : "No Hotspot"}
                              </span>
                              <span className="rounded-full border border-line px-3 py-1 text-muted">{assigned.length} ports</span>
                            </div>
                            <p className="text-muted">{assigned.length ? assigned.map((iface) => iface.name).join(", ") : "No ports assigned"}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>
          </div>
        ) : null}
        {interfaces.length ? (
          <details className="panel p-5">
            <summary className="cursor-pointer text-sm font-semibold text-ink">Detailed port list</summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {interfaces.map((iface) => (
                <div key={iface.name} className="rounded-md border border-line bg-soft/40 p-4">
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
          </details>
        ) : null}
        {error ? <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save and Preview"}
        </button>
      </form>
    </SetupShell>
  );
}

function gatewayFor(role: string, profile: NetworkProfile | null) {
  switch (role) {
    case "HOTSPOT_LAN":
      return profile?.hotspot_gateway ?? "-";
    case "STAFF_LAN":
      return profile?.staff_gateway ?? "-";
    case "POS_LAN":
      return profile?.pos_gateway ?? "-";
    case "CCTV_LAN":
      return profile?.cctv_gateway ?? "-";
    default:
      return "-";
  }
}

