"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { OperationsTitle, StatusBadge } from "@/components/OperationsUI";
import { apiFetch } from "@/lib/api";

type RouterRow = {
  id: string;
  name: string;
  site_name?: string;
  model?: string;
  expected_model?: string;
  routeros_version?: string;
  serial_number?: string;
  status: string;
  last_seen_at?: string;
  telemetry_updated_at?: string;
  telemetry_last_error?: string;
  health_status?: string;
  uptime?: string;
  cpu_load?: string;
  active_hotspot_users?: number;
};

export default function RoutersPage() {
  const [routers, setRouters] = useState<RouterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    const loadRouters = async (initial = false) => {
      if (inFlight) {
        return;
      }
      inFlight = true;
      if (initial) {
        setLoading(true);
      }
      try {
        const rows = await apiFetch<RouterRow[]>("/api/v1/routers");
        if (!cancelled) {
          setRouters(rows);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load routers.");
        }
      } finally {
        inFlight = false;
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadRouters(true);
    const refresh = () => loadRouters(false);
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
    };
  }, []);

  return (
    <>
      <OperationsTitle
        title="Routers"
        description="Manage your network infrastructure, review scheduled router telemetry, and open remote access."
        action={
          <Link href="/routers/new" className="btn">
            Add Router
          </Link>
        }
      />
      <div className="panel overflow-hidden">
        {error ? <p className="p-6 text-sm text-red-300">{error}</p> : null}
        {loading ? <p className="p-6 text-sm text-muted">Loading routers...</p> : null}
        {!loading && !error && routers.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-line bg-soft text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">Router</th>
                  <th className="px-4 py-3">Model / Version</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">CPU Load</th>
                  <th className="px-4 py-3">Uptime</th>
                  <th className="px-4 py-3">Users</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {routers.map((router) => (
                  <tr key={router.id} className="hover:bg-soft">
                    <td className="px-4 py-3 font-medium text-ink">
                      <Link href={`/routers/${router.id}`}>
                        <span className="block">{router.name}</span>
                        <span className="text-xs font-normal text-muted">{router.site_name ?? "No site"}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <span className="block">{router.model ?? router.expected_model ?? "Not linked"}</span>
                      <span className="text-xs">{router.routeros_version ?? "Version pending"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge label={titleCase(router.health_status ?? router.status)} />
                    </td>
                    <td className="px-4 py-3 text-muted">{formatCpu(router.cpu_load)}</td>
                    <td className="px-4 py-3 text-muted">{formatUptime(router.uptime)}</td>
                    <td className="px-4 py-3 text-muted">{router.active_hotspot_users ?? "--"}</td>
                    <td className="px-4 py-3 text-muted">
                      <Link href={`/routers/${router.id}`} className="font-semibold text-brand">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {!loading && !error && !routers.length ? (
          <div className="p-6 text-sm text-muted">
            No routers have been created yet. Add a router to generate a claim token, then open it to link the physical MikroTik.
          </div>
        ) : null}
      </div>
    </>
  );
}

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "Pending";
}

function formatCpu(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return "--";
  }
  return trimmed.endsWith("%") ? trimmed : `${trimmed}%`;
}

function formatUptime(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return "Telemetry pending";
  }
  return trimmed.replace(/(\d+)([wdhms])/g, "$1$2 ").trim();
}
