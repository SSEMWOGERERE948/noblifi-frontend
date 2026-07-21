"use client";

import { FormEvent, use, useEffect, useState } from "react";
import { apiGet, apiPut, InterfaceInfo } from "@/lib/router-setup";

const roles = ["WAN", "HOTSPOT_LAN", "STAFF_LAN", "POS_LAN", "CCTV_LAN", "DISABLED"];

function isAssignableInterface(iface: InterfaceInfo) {
  const type = (iface.type ?? "").toLowerCase();
  const name = iface.name.toLowerCase();
  if (type.includes("bridge") || name.includes("bridge") || name.startsWith("br-")) return false;
  if (type.includes("loopback") || type.includes("tunnel")) return false;
  if (type.includes("wireguard") || type === "wg" || name.includes("wireguard") || name.startsWith("wg") || name.includes("-wg")) return false;
  return true;
}

export default function RouterPortsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [interfaces, setInterfaces] = useState<InterfaceInfo[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ interfaces: InterfaceInfo[] }>(`/api/v1/routers/${id}/interfaces`)
      .then((data) => {
        const nextInterfaces = data.interfaces.filter(isAssignableInterface);
        setInterfaces(nextInterfaces);
        setAssignments((current) => {
          const next = { ...current };
          nextInterfaces.forEach((iface, index) => {
            if (!next[iface.name]) next[iface.name] = index === 0 ? "WAN" : index < 3 ? "HOTSPOT_LAN" : "DISABLED";
          });
          return next;
        });
      })
      .catch((err) => setMessage(err instanceof Error ? err.message : "Could not load MikroTik interfaces."))
      .finally(() => setLoading(false));
  }, [id]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!interfaces.length) {
      setMessage("No MikroTik interfaces have been discovered yet. Link the router first.");
      return;
    }
    setMessage("Saving...");
    try {
      await apiPut(`/api/v1/routers/${id}/port-assignments`, {
        assignments: interfaces.map((iface) => ({ interface: iface.name, role: assignments[iface.name] ?? "DISABLED" }))
      });
      setMessage("Port assignments saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Assignments failed validation.");
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">Configure Ports</h1>
        <p className="mt-1 text-sm text-muted">Assign real MikroTik interfaces discovered during router check-in.</p>
      </div>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? <p className="text-sm text-muted">Loading interfaces...</p> : null}
        {!loading && !interfaces.length ? (
          <p className="panel p-4 text-sm text-muted md:col-span-2 xl:col-span-3">
            No interfaces are available yet. Open the router page, run the Link MikroTik registration script, then return here.
          </p>
        ) : null}
        {interfaces.map((iface) => (
          <div key={iface.name} className="panel p-4">
            <div className="mb-3">
              <div className="text-base font-semibold text-ink">{iface.name}</div>
              <div className="text-xs text-muted">{iface.type ?? "unknown"} - {iface.running ? "running" : "down"}</div>
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
        <div className="md:col-span-2 xl:col-span-3">
          <button className="btn" type="submit" disabled={!interfaces.length}>
            Save assignments
          </button>
          {message ? <span className="ml-3 text-sm text-muted">{message}</span> : null}
        </div>
      </form>
    </div>
  );
}
