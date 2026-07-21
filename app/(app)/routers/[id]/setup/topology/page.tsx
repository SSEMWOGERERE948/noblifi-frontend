"use client";

import { FormEvent, use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SetupShell } from "@/components/router-setup/SetupShell";
import { apiGet, apiPut, InterfaceInfo } from "@/lib/router-setup";

const roles = ["WAN", "HOTSPOT_LAN", "STAFF_LAN", "POS_LAN", "CCTV_LAN", "DISABLED"];

const roleMeta: Record<string, { label: string; bridge: string; subnet: string; tone: string }> = {
  WAN: { label: "WAN", bridge: "Internet uplink", subnet: "DHCP client", tone: "border-amber-400/40 bg-amber-400/10 text-amber-200" },
  HOTSPOT_LAN: { label: "HotSpot LAN", bridge: "br-hotspot", subnet: "10.10.10.0/24", tone: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" },
  STAFF_LAN: { label: "Staff LAN", bridge: "br-staff", subnet: "10.20.20.0/24", tone: "border-sky-400/40 bg-sky-400/10 text-sky-200" },
  POS_LAN: { label: "POS LAN", bridge: "br-pos", subnet: "10.30.30.0/24", tone: "border-violet-400/40 bg-violet-400/10 text-violet-200" },
  CCTV_LAN: { label: "CCTV LAN", bridge: "br-cctv", subnet: "10.40.40.0/24", tone: "border-orange-400/40 bg-orange-400/10 text-orange-200" },
  DISABLED: { label: "Disabled", bridge: "Not configured", subnet: "No bridge", tone: "border-slate-500/40 bg-slate-500/10 text-slate-300" }
};

function isAssignableInterface(iface: InterfaceInfo) {
  const type = (iface.type ?? "").toLowerCase();
  const name = iface.name.toLowerCase();
  if (type.includes("bridge") || name.includes("bridge") || name.startsWith("br-")) return false;
  if (type.includes("loopback") || type.includes("tunnel")) return false;
  if (type.includes("wireguard") || type === "wg" || name.includes("wireguard") || name.startsWith("wg") || name.includes("-wg")) return false;
  return true;
}

function PortIcon() {
  return (
    <svg aria-hidden="true" className="h-7 w-7" viewBox="0 0 24 24" fill="none">
      <path d="M7 5h10v8h-3v4h-4v-4H7V5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 5V3m3 2V3m3 2V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 19h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BridgeIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path d="m12 4 7 4-7 4-7-4 7-4Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="m5 12 7 4 7-4M5 16l7 4 7-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function displayType(iface: InterfaceInfo) {
  return iface.type || (iface.name.toLowerCase().startsWith("sfp") ? "sfp" : "ethernet");
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
            if (index === 0) {
              seeded[iface.name] = "WAN";
            } else if (next.length >= 3 && index === next.length - 1) {
              seeded[iface.name] = "STAFF_LAN";
            } else {
              seeded[iface.name] = "HOTSPOT_LAN";
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
    let staff = 0;
    for (const iface of interfaces) {
      const role = assignments[iface.name];
      if (names.has(iface.name)) return `Duplicate interface ${iface.name}.`;
      names.add(iface.name);
      if (!roles.includes(role)) return `Unknown role ${role} for ${iface.name}.`;
      if (iface.disabled && (role === "WAN" || role === "HOTSPOT_LAN")) return `${iface.name} is disabled and cannot be used for ${role}.`;
      if (role === "WAN") wan++;
      if (role === "HOTSPOT_LAN") hotspot++;
      if (role === "STAFF_LAN") staff++;
    }
    if (wan !== 1) return "Exactly one WAN interface is required.";
    if (hotspot < 1) return "At least one HOTSPOT_LAN interface is required.";
    if (interfaces.length >= 3 && staff < 1) return "Reserve at least one STAFF_LAN interface for management access before applying HotSpot.";
    return "";
  }

  const groups = roles.map((role) => ({
    role,
    ports: interfaces.filter((iface) => (assignments[iface.name] ?? "DISABLED") === role)
  }));

  return (
    <SetupShell title="Automatic Topology Setup" description="Review discovered MikroTik LAN interfaces and assign each physical port to the correct network role." current="topology">
      <form onSubmit={submit} className="space-y-5">
        {loading ? <p className="text-sm text-muted">Loading interfaces...</p> : null}
        {!loading && !interfaces.length ? (
          <p className="rounded-md border border-line bg-white/5 p-4 text-sm text-muted">
            No assignable MikroTik ports were discovered. If this router is linked, refresh after the bootstrap script reports ether interfaces.
          </p>
        ) : null}
        {interfaces.length ? (
          <div className="overflow-hidden rounded-lg border border-line bg-[#07101c]">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">MikroTik LAN Interfaces</h2>
                <p className="text-sm text-muted">Live physical ports from the router check-in.</p>
              </div>
              <span className="rounded-md border border-line bg-soft px-3 py-1 text-xs font-medium text-muted">
                {interfaces.length} interface{interfaces.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="relative overflow-x-auto p-5">
              <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_1px_1px,#5f7891_1px,transparent_0)] [background-size:20px_20px]" />
              <div className="relative min-w-[760px] space-y-5">
                <section className="rounded-lg border border-line bg-[#090f1d]/95 shadow-sm">
                  <div className="flex items-center justify-between border-b border-line px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-black/30 text-brand">
                        <BridgeIcon />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-ink">Router port panel</div>
                        <div className="text-xs text-muted">Ethernet and SFP interfaces</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted">Role map</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
                    {interfaces.map((iface, index) => {
                      const selectedRole = assignments[iface.name] ?? "DISABLED";
                      const meta = roleMeta[selectedRole] ?? roleMeta.DISABLED;
                      return (
                        <div key={iface.name} className="rounded-lg border border-line bg-soft p-3">
                          <div className="mb-3 flex items-start justify-between gap-2">
                            <div className="text-brand">
                              <PortIcon />
                            </div>
                            <span className={`rounded px-2 py-1 text-[11px] font-semibold ${meta.tone}`}>
                              {meta.label}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-base font-semibold text-ink">{iface.name || `port-${index + 1}`}</div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                              <span className={`h-2 w-2 rounded-full ${iface.disabled ? "bg-red-400" : iface.running ? "bg-emerald-400" : "bg-slate-500"}`} />
                              <span>{iface.disabled ? "disabled" : iface.running ? "running" : "down"}</span>
                              <span>{displayType(iface)}</span>
                            </div>
                            {iface.mac_address ? <div className="mt-1 truncate text-[11px] text-muted">{iface.mac_address}</div> : null}
                          </div>
                          <label className="mt-3 block">
                            <span className="sr-only">Role for {iface.name}</span>
                            <select
                              className="field h-10"
                              value={selectedRole}
                              onChange={(event) => setAssignments((current) => ({ ...current, [iface.name]: event.target.value }))}
                            >
                              {roles.map((role) => (
                                <option key={role} value={role}>
                                  {roleMeta[role].label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="grid gap-3 lg:grid-cols-3">
                  {groups.filter((group) => group.role !== "DISABLED" || group.ports.length).map((group) => {
                    const meta = roleMeta[group.role];
                    return (
                      <div key={group.role} className="rounded-lg border border-line bg-[#0b1420]/95 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="text-brand"><BridgeIcon /></span>
                            <h3 className="truncate text-base font-semibold text-ink">{meta.bridge}</h3>
                          </div>
                          <span className={`rounded px-2 py-1 text-[11px] font-semibold ${meta.tone}`}>{meta.label}</span>
                        </div>
                        <dl className="grid grid-cols-2 gap-3 border-t border-line pt-3 text-xs">
                          <div>
                            <dt className="text-muted">Subnet</dt>
                            <dd className="mt-1 font-medium text-ink">{meta.subnet}</dd>
                          </div>
                          <div>
                            <dt className="text-muted">Ports</dt>
                            <dd className="mt-1 font-medium text-ink">{group.ports.length || "None"}</dd>
                          </div>
                        </dl>
                        <div className="mt-3 flex min-h-8 flex-wrap gap-2">
                          {group.ports.length ? group.ports.map((iface) => (
                            <span key={iface.name} className="rounded-md border border-line bg-white/5 px-2 py-1 text-xs text-ink">
                              {iface.name}
                            </span>
                          )) : (
                            <span className="text-xs text-muted">No interfaces assigned</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </section>
              </div>
            </div>
          </div>
        ) : null}
        {error ? <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn" type="submit" disabled={submitting || !interfaces.length}>
            {submitting ? "Saving..." : "Save and Preview"}
          </button>
          <p className="text-sm text-muted">Reserve one staff port for recovery before applying HotSpot.</p>
        </div>
      </form>
    </SetupShell>
  );
}


