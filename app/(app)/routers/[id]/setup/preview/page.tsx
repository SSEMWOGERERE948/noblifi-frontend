"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { CodeBlock } from "@/components/router-setup/CodeBlock";
import { SetupShell } from "@/components/router-setup/SetupShell";
import {
  apiGet,
  apiPost,
  ConfigPreview,
} from "@/lib/router-setup";

const summaryItems = [
  {
    key: "wan",
    label: "WAN",
    description: "Internet uplink",
  },
  {
    key: "hotspot_lan",
    label: "HotSpot LAN",
    description: "Ports connected to br-hotspot",
  },
  {
    key: "free_lan",
    label: "Free LAN",
    description: "Management port outside the HotSpot",
  },
  {
    key: "disabled",
    label: "Disabled",
    description: "Unused or system interfaces",
  },
] as const;

export default function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [preview, setPreview] =
    useState<ConfigPreview | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [installCommand, setInstallCommand] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      setError("");
      setSuccess("");
      setPreview(null);
      setInstallCommand("");

      try {
        const previewData =
          await apiGet<ConfigPreview>(
            `/api/v1/routers/${id}/config-preview`,
          );

        if (cancelled) {
          return;
        }

        setPreview(previewData);

        const hotspotCommandData =
          await apiGet<{ script: string }>(
            `/api/v1/routers/${id}/hotspot-install-command`,
          );

        if (cancelled) {
          return;
        }

        setInstallCommand(
          hotspotCommandData.script ?? "",
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        setPreview(null);
        setInstallCommand("");

        setError(
          err instanceof Error
            ? err.message
            : "Could not load configuration preview.",
        );
      }
    }

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function deploy() {
    setDeploying(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await apiPost<{
          message: string;
          status: string;
        }>(
          `/api/v1/routers/${id}/deploy`,
        );

      setSuccess(
        `${response.message}. Run the MikroTik install command below to install or repair WAN DHCP, the HotSpot bridge, HotSpot DHCP, RADIUS, NAT, DNS, captive portal files and the selected port topology.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not queue deployment.",
      );
    } finally {
      setDeploying(false);
    }
  }

  function summaryValue(key: string): string {
    if (!preview?.summary) {
      return "Loading...";
    }

    const summary =
      preview.summary as Record<
        string,
        string[] | undefined
      >;

    const values = summary[key];

    if (!values?.length) {
      return "None";
    }

    return values.join(", ");
  }

  return (
    <SetupShell
      title="Config Preview"
      description="Review the NobliFi MikroTik topology and RouterOS installation script before deployment."
      current="preview"
    >
      <div className="space-y-6">
        {/* Error */}
        {error ? (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm font-medium text-red-300">
              {error}
            </p>
          </div>
        ) : null}

        {/* Success */}
        {success ? (
          <div className="rounded-md border border-emerald-400/40 bg-emerald-400/10 p-4">
            <p className="text-sm font-semibold text-emerald-300">
              {success}
            </p>
          </div>
        ) : null}

        {/* Topology summary */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-ink">
              Port Configuration
            </h2>

            <p className="mt-1 text-sm text-muted">
              Confirm the physical port assignments
              that NobliFi will apply to this MikroTik.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryItems.map(
              ({
                key,
                label,
                description,
              }) => (
                <div
                  key={key}
                  className="panel p-5"
                >
                  <p className="text-sm font-medium text-muted">
                    {label}
                  </p>

                  <p className="mt-3 break-words text-lg font-semibold text-ink">
                    {summaryValue(key)}
                  </p>

                  <p className="mt-2 text-xs text-muted">
                    {description}
                  </p>
                </div>
              ),
            )}
          </div>
        </section>

        {/* Topology explanation */}
        <section className="panel p-5">
          <h2 className="text-base font-semibold text-ink">
            NobliFi Network Layout
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-md border border-line bg-white/5 p-4">
              <p className="text-sm font-semibold text-ink">
                WAN
              </p>

              <p className="mt-1 text-sm text-muted">
                Connects to the upstream router or
                ISP. NobliFi keeps the WAN DHCP
                client active during installation.
              </p>
            </div>

            <div className="rounded-md border border-emerald-400/30 bg-emerald-400/5 p-4">
              <p className="text-sm font-semibold text-emerald-300">
                HotSpot LAN
              </p>

              <p className="mt-1 text-sm text-muted">
                These ports join{" "}
                <span className="font-semibold text-ink">
                  br-hotspot
                </span>{" "}
                and receive the NobliFi captive
                portal and DHCP service.
              </p>
            </div>

            <div className="rounded-md border border-amber-400/30 bg-amber-400/5 p-4">
              <p className="text-sm font-semibold text-amber-300">
                Free LAN
              </p>

              <p className="mt-1 text-sm text-muted">
                This port remains outside{" "}
                <span className="font-semibold text-ink">
                  br-hotspot
                </span>{" "}
                and can be used for direct router
                management or another network.
              </p>
            </div>
          </div>
        </section>

        {/* Install command */}
        <section>
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-ink">
              MikroTik Install Command
            </h2>

            <p className="mt-1 text-sm text-muted">
              Run this command on the MikroTik after
              saving the topology. It downloads the
              latest tenant-specific NobliFi
              configuration and imports it.
            </p>
          </div>

          <div className="mb-6">
            <CodeBlock
              code={
                installCommand ||
                "Loading install command..."
              }
            />
          </div>

          <div className="mb-3">
            <h2 className="text-lg font-semibold text-ink">
              Generated RouterOS Configuration
            </h2>

            <p className="mt-1 text-sm text-muted">
              This is the configuration that will be
              applied to the MikroTik.
            </p>
          </div>

          <CodeBlock
            code={
              preview?.script ?? "Loading..."
            }
            filename="noblifi-config.rsc"
          />
        </section>

        {/* Installation information */}
        <section className="panel p-5">
          <h2 className="text-base font-semibold text-ink">
            What NobliFi Will Configure
          </h2>

          <div className="mt-4 grid gap-3 text-sm text-muted md:grid-cols-2">
            <div className="rounded-md border border-line bg-white/5 p-3">
              WAN DHCP client
            </div>

            <div className="rounded-md border border-line bg-white/5 p-3">
              br-hotspot bridge
            </div>

            <div className="rounded-md border border-line bg-white/5 p-3">
              HotSpot DHCP server and pool
            </div>

            <div className="rounded-md border border-line bg-white/5 p-3">
              RADIUS authentication
            </div>

            <div className="rounded-md border border-line bg-white/5 p-3">
              NAT and DNS
            </div>

            <div className="rounded-md border border-line bg-white/5 p-3">
              Tenant HotSpot DNS name
            </div>

            <div className="rounded-md border border-line bg-white/5 p-3">
              Captive portal files in /flash/noblifi
            </div>

            <div className="rounded-md border border-line bg-white/5 p-3">
              FREE_LAN kept outside br-hotspot
            </div>
          </div>
        </section>

        {/* Navigation */}
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/routers/${id}/setup/topology`}
            className="btn-secondary"
          >
            Back to Ports
          </Link>

          <Link
            href={`/routers/${id}/network-profile`}
            className="btn-secondary"
          >
            Edit Network Profile
          </Link>

          <button
            type="button"
            className="btn"
            onClick={deploy}
            disabled={
              deploying ||
              !preview ||
              !installCommand
            }
          >
            {deploying
              ? "Queueing..."
              : "Mark Queued"}
          </button>
        </div>
      </div>
    </SetupShell>
  );
}