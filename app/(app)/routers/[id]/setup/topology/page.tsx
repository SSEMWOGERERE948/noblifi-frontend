"use client";

import { FormEvent, use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SetupShell } from "@/components/router-setup/SetupShell";
import { apiGet, apiPut, InterfaceInfo } from "@/lib/router-setup";

const ROLE_WAN = "WAN";
const ROLE_HOTSPOT = "HOTSPOT_LAN";
const ROLE_FREE = "FREE_LAN";
const ROLE_DISABLED = "DISABLED";

export default function TopologyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [interfaces, setInterfaces] = useState<InterfaceInfo[]>([]);
  const [wanPort, setWanPort] = useState("");
  const [freePort, setFreePort] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Only show real physical Ethernet ports.
   *
   * We deliberately hide:
   * - br-hotspot
   * - br-staff
   * - bridge
   * - loopback / lo
   * - WireGuard
   * - other virtual interfaces
   */
  const physicalPorts = useMemo(() => {
    return interfaces.filter(isPhysicalEthernetPort);
  }, [interfaces]);

  /**
   * LAN ports are every physical port except the selected WAN.
   */
  const lanPorts = useMemo(() => {
    return physicalPorts.filter((iface) => iface.name !== wanPort);
  }, [physicalPorts, wanPort]);

  useEffect(() => {
    setLoading(true);
    setError("");

    apiGet<{ interfaces: InterfaceInfo[] }>(
      `/api/v1/routers/${id}/interfaces`
    )
      .then((data) => {
        const discovered = data.interfaces ?? [];

        setInterfaces(discovered);

        const physical = discovered.filter(isPhysicalEthernetPort);

        if (!physical.length) {
          return;
        }

        /**
         * Prefer ether1 as WAN.
         *
         * If ether1 is not available, use the first running physical port.
         * If none are running, use the first physical port.
         */
        const preferredWAN =
          physical.find((iface) => iface.name === "ether1") ??
          physical.find((iface) => iface.running) ??
          physical[0];

        setWanPort(preferredWAN.name);

        const availableLAN = physical.filter(
          (iface) => iface.name !== preferredWAN.name
        );

        /**
         * Prefer the highest/last physical LAN port as FREE_LAN.
         *
         * Example:
         *
         * ether1 -> WAN
         * ether2 -> HOTSPOT
         * ether3 -> HOTSPOT
         * ether4 -> HOTSPOT
         * ether5 -> FREE
         */
        if (availableLAN.length > 0) {
          setFreePort(availableLAN[availableLAN.length - 1].name);
        }
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load MikroTik interfaces."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  /**
   * If the WAN port changes and the currently-selected free port becomes WAN,
   * automatically choose another free LAN port.
   */
  useEffect(() => {
    if (!wanPort) {
      return;
    }

    const availableLAN = physicalPorts.filter(
      (iface) => iface.name !== wanPort
    );

    if (!availableLAN.length) {
      setFreePort("");
      return;
    }

    if (
      !freePort ||
      freePort === wanPort ||
      !availableLAN.some((iface) => iface.name === freePort)
    ) {
      setFreePort(availableLAN[availableLAN.length - 1].name);
    }
  }, [wanPort, freePort, physicalPorts]);

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
      /**
       * IMPORTANT:
       *
       * Send every discovered interface to the backend.
       *
       * Physical interfaces:
       * - selected WAN -> WAN
       * - selected free port -> FREE_LAN
       * - every other physical LAN port -> HOTSPOT_LAN
       *
       * Virtual/system interfaces:
       * - DISABLED
       *
       * This prevents br-hotspot, lo, noblifi-wg, etc. from ever being treated
       * as user-selectable hotspot ports.
       */
      const assignments = interfaces.map((iface) => {
        let role = ROLE_DISABLED;

        if (isPhysicalEthernetPort(iface)) {
          if (iface.name === wanPort) {
            role = ROLE_WAN;
          } else if (iface.name === freePort) {
            role = ROLE_FREE;
          } else {
            role = ROLE_HOTSPOT;
          }
        }

        return {
          interface: iface.name,
          role,
        };
      });

      await apiPut(`/api/v1/routers/${id}/port-assignments`, {
        assignments,
      });

      router.push(`/routers/${id}/setup/preview`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save port assignments."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function validate(): string {
    if (!interfaces.length) {
      return "No MikroTik interfaces have been discovered yet. Link the router first from the Remote Access step.";
    }

    if (!physicalPorts.length) {
      return "No physical Ethernet ports were discovered on this MikroTik.";
    }

    if (!wanPort) {
      return "A WAN port is required.";
    }

    const wan = physicalPorts.find((iface) => iface.name === wanPort);

    if (!wan) {
      return "The selected WAN interface is not a valid physical Ethernet port.";
    }

    if (wan.disabled) {
      return `${wan.name} is disabled and cannot be used as the WAN port.`;
    }

    if (lanPorts.length < 2) {
      return "The router needs at least two LAN ports: one HotSpot port and one free port.";
    }

    if (!freePort) {
      return "Select one LAN port to remain free outside the NobliFi HotSpot.";
    }

    if (freePort === wanPort) {
      return "The WAN port cannot also be the free LAN port.";
    }

    const free = lanPorts.find((iface) => iface.name === freePort);

    if (!free) {
      return "The selected free port is not a valid LAN port.";
    }

    const hotspotPorts = lanPorts.filter(
      (iface) => iface.name !== freePort
    );

    if (!hotspotPorts.length) {
      return "At least one LAN port must be assigned to the NobliFi HotSpot.";
    }

    const disabledHotspot = hotspotPorts.find(
      (iface) => iface.disabled
    );

    if (disabledHotspot) {
      return `${disabledHotspot.name} is disabled and cannot be used for the NobliFi HotSpot.`;
    }

    return "";
  }

  if (loading) {
    return (
      <SetupShell
        title="Select HotSpot Ports"
        description="Choose which MikroTik ports will provide NobliFi HotSpot access."
        current="topology"
      >
        <p className="text-sm text-muted">
          Loading MikroTik ports...
        </p>
      </SetupShell>
    );
  }

  return (
    <SetupShell
      title="Select HotSpot Ports"
      description="Choose one free LAN port. All other LAN ports will automatically provide NobliFi HotSpot access."
      current="topology"
    >
      <form onSubmit={submit} className="space-y-6">
        {!physicalPorts.length ? (
          <div className="rounded-md border border-line bg-white/5 p-4">
            <p className="text-sm text-muted">
              No physical Ethernet ports have been discovered for this router.
              Go back to Remote Access, register the MikroTik, and then return
              here.
            </p>
          </div>
        ) : null}

        {physicalPorts.length > 0 ? (
          <>
            {/* WAN */}
            <section className="panel p-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-ink">
                  Internet Port
                </h2>

                <p className="mt-1 text-sm text-muted">
                  This port connects the MikroTik to your upstream internet
                  router or ISP.
                </p>
              </div>

              <div className="max-w-md">
                <label className="mb-2 block text-sm font-medium text-ink">
                  WAN
                </label>

                <select
                  className="field"
                  value={wanPort}
                  onChange={(event) => {
                    setWanPort(event.target.value);
                    setError("");
                  }}
                >
                  {physicalPorts.map((iface) => (
                    <option
                      key={iface.name}
                      value={iface.name}
                      disabled={iface.disabled}
                    >
                      {iface.name}
                      {iface.running ? " — connected" : " — no link"}
                      {iface.disabled ? " — disabled" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* LAN PORTS */}
            <section>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-ink">
                  LAN Ports
                </h2>

                <p className="mt-1 text-sm text-muted">
                  Select exactly one port to remain free. Every other LAN port
                  will be connected to the NobliFi HotSpot bridge.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {lanPorts.map((iface) => {
                  const isFree = freePort === iface.name;
                  const isHotspot = !isFree;

                  return (
                    <button
                      key={iface.name}
                      type="button"
                      disabled={iface.disabled}
                      onClick={() => {
                        if (!iface.disabled) {
                          setFreePort(iface.name);
                          setError("");
                        }
                      }}
                      className={[
                        "panel p-5 text-left transition",
                        iface.disabled
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer",
                        isFree
                          ? "border-amber-400/60"
                          : "border-accent/40",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <PortIcon running={iface.running} />

                          <div>
                            <h3 className="text-lg font-semibold text-ink">
                              {iface.name}
                            </h3>

                            <p className="text-sm text-muted">
                              {iface.running
                                ? "Connected"
                                : "No cable/link detected"}
                            </p>
                          </div>
                        </div>

                        {iface.disabled ? (
                          <span className="rounded-full bg-red-500/15 px-2 py-1 text-xs font-semibold text-red-300">
                            Disabled
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-5">
                        {isFree ? (
                          <div className="rounded-md border border-amber-400/30 bg-amber-400/10 p-3">
                            <p className="font-semibold text-ink">
                              Free Port
                            </p>

                            <p className="mt-1 text-xs text-muted">
                              This port will stay outside br-hotspot.
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-md border border-accent/30 bg-emerald-400/10 p-3">
                            <p className="font-semibold text-accent">
                              NobliFi HotSpot
                            </p>

                            <p className="mt-1 text-xs text-muted">
                              This port will join br-hotspot.
                            </p>
                          </div>
                        )}
                      </div>

                      {!iface.disabled ? (
                        <div className="mt-4 flex items-center gap-2">
                          <span
                            className={[
                              "flex h-5 w-5 items-center justify-center rounded-full border",
                              isFree
                                ? "border-amber-400"
                                : "border-line",
                            ].join(" ")}
                          >
                            {isFree ? (
                              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                            ) : null}
                          </span>

                          <span className="text-xs text-muted">
                            {isFree
                              ? "Selected as free port"
                              : "Click to make this the free port"}
                          </span>
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* SUMMARY */}
            <section className="panel p-5">
              <h2 className="text-base font-semibold text-ink">
                Configuration Summary
              </h2>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <SummaryItem
                  label="Internet"
                  value={wanPort || "Not selected"}
                />

                <SummaryItem
                  label="HotSpot"
                  value={
                    lanPorts
                      .filter((iface) => iface.name !== freePort)
                      .map((iface) => iface.name)
                      .join(", ") || "None"
                  }
                />

                <SummaryItem
                  label="Free Port"
                  value={freePort || "Not selected"}
                />
              </div>

              <div className="mt-4 rounded-md border border-line bg-white/5 p-3">
                <p className="text-xs text-muted">
                  HotSpot ports will join{" "}
                  <span className="font-semibold text-ink">
                    br-hotspot
                  </span>{" "}
                  and receive NobliFi DHCP. The free port will not be added to
                  the HotSpot bridge.
                </p>
              </div>
            </section>
          </>
        ) : null}

        {error ? (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end">
          <button
            className="btn"
            type="submit"
            disabled={submitting || !physicalPorts.length}
          >
            {submitting
              ? "Saving..."
              : "Save Ports and Preview"}
          </button>
        </div>
      </form>
    </SetupShell>
  );
}

function isPhysicalEthernetPort(iface: InterfaceInfo): boolean {
  const name = iface.name.trim().toLowerCase();
  const type = (iface.type ?? "").trim().toLowerCase();

  /**
   * Explicitly reject known virtual/system interfaces.
   */
  if (
    name === "lo" ||
    name === "loopback" ||
    name.startsWith("br-") ||
    name === "bridge" ||
    name.includes("wireguard") ||
    name.includes("-wg") ||
    type.includes("bridge") ||
    type.includes("loopback") ||
    type.includes("wireguard") ||
    type === "wg"
  ) {
    return false;
  }

  /**
   * MikroTik physical copper ports normally appear as:
   *
   * ether1
   * ether2
   * ether3
   * ...
   *
   * The API screenshot also reports their type as "ether".
   */
  if (/^ether\d+$/i.test(name)) {
    return true;
  }

  return type === "ether" || type === "ethernet";
}

function PortIcon({ running }: { running: boolean }) {
  return (
    <div
      className={[
        "mt-1 flex h-11 w-11 items-center justify-center rounded-md border",
        running
          ? "border-accent bg-emerald-400/10 text-accent"
          : "border-line bg-soft text-muted",
      ].join(" ")}
    >
      <div className="relative h-6 w-6 rounded-sm border-2 border-current">
        <span className="absolute left-1 top-1 h-1 w-1 rounded-full bg-current" />
        <span className="absolute left-3 top-1 h-1 w-1 rounded-full bg-current" />
        <span className="absolute bottom-1 left-1 right-1 h-1 rounded-full bg-current" />
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-line bg-white/5 p-3">
      <p className="text-xs uppercase tracking-wide text-muted">
        {label}
      </p>

      <p className="mt-1 font-semibold text-ink">
        {value}
      </p>
    </div>
  );
}