"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { apiGet, apiPut } from "@/lib/router-setup";

type NetworkProfile = Record<string, string | boolean | null>;

const textFields = [
  ["name", "Profile name"],
  ["radius_server", "RADIUS server"],
  ["radius_secret", "RADIUS secret"],
  ["router_identity", "Router identity"],
  ["api_username", "API username"],
  ["api_password", "API password"],
  ["hotspot_portal_name", "Captive portal name"],
  ["hotspot_template_key", "Captive portal template"],
  ["hotspot_dns_name", "HotSpot DNS name"],
  ["hotspot_bridge", "HotSpot bridge"],
  ["staff_bridge", "Staff bridge"],
  ["pos_bridge", "POS bridge"],
  ["cctv_bridge", "CCTV bridge"],
  ["hotspot_subnet", "HotSpot subnet"],
  ["hotspot_gateway", "HotSpot gateway"],
  ["hotspot_pool", "HotSpot pool"],
  ["staff_subnet", "Staff subnet"],
  ["staff_gateway", "Staff gateway"],
  ["staff_pool", "Staff pool"],
  ["pos_subnet", "POS subnet"],
  ["pos_gateway", "POS gateway"],
  ["pos_pool", "POS pool"],
  ["cctv_subnet", "CCTV subnet"],
  ["cctv_gateway", "CCTV gateway"],
  ["cctv_pool", "CCTV pool"],
  ["wan_mode", "WAN mode"]
];

const portalTemplates = [
  { key: "clean", name: "Clean Access", tone: "bg-sky-400", description: "Clear voucher login with cool blue accents." },
  { key: "fresh", name: "Fresh Market", tone: "bg-emerald-300", description: "Green and aqua theme for cafes, salons, and public spaces." },
  { key: "sunrise", name: "Sunrise Lounge", tone: "bg-amber-300", description: "Warm premium look for hotels, restaurants, and event venues." },
  { key: "royal", name: "Royal Night", tone: "bg-violet-300", description: "Deep polished theme for bars, lounges, and late-night venues." }
];

export default function NetworkProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [profile, setProfile] = useState<NetworkProfile | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<NetworkProfile>(`/api/v1/routers/${id}/network-profile`)
      .then(setProfile)
      .catch((error) => setMessage(error instanceof Error ? error.message : "Could not load network profile."));
  }, [id]);

  async function save() {
    if (!profile) return;
    setSaving(true);
    setMessage("");
    try {
      const updated = await apiPut<NetworkProfile>(`/api/v1/routers/${id}/network-profile`, profile);
      setProfile(updated);
      setMessage("Network profile saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  function setValue(key: string, value: string | boolean) {
    setProfile((current) => (current ? { ...current, [key]: value } : current));
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Network Profile</h1>
          <p className="mt-1 text-sm text-muted">Override script defaults for this specific router or client site.</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/routers/${id}/setup/topology`} className="btn-secondary">
            Topology
          </Link>
          <Link href={`/routers/${id}/setup/preview`} className="btn-secondary">
            Preview
          </Link>
        </div>
      </div>

      {!profile ? <p className="text-sm text-muted">Loading profile...</p> : null}

      {profile ? (
        <div className="space-y-6">
          <div className="panel p-5">
            <h2 className="text-lg font-semibold text-ink">Portal templates</h2>
            <p className="mt-1 text-sm text-muted">Choose a starting style for this router's captive portal. The portal name above stays client-controlled.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {portalTemplates.map((template) => {
                const active = profile.hotspot_template_key === template.key || (!profile.hotspot_template_key && template.key === "clean");
                return (
                  <button
                    key={template.key}
                    className={`rounded-md border p-4 text-left transition ${active ? "border-brand bg-soft" : "border-line hover:bg-soft"}`}
                    type="button"
                    onClick={() => setValue("hotspot_template_key", template.key)}
                  >
                    <span className={`mb-4 block h-16 rounded-md ${template.tone}`} />
                    <span className="block font-semibold text-ink">{template.name}</span>
                    <span className="mt-2 block text-xs leading-5 text-muted">{template.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="panel grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {textFields.map(([key, label]) => (
              <label key={key} className="text-sm font-medium text-ink">
                {label}
                <input className="field mt-2" value={String(profile[key] ?? "")} onChange={(event) => setValue(key, event.target.value)} />
              </label>
            ))}
          </div>

          <div className="panel grid gap-4 p-5 md:grid-cols-3">
            {[
              ["disable_www_service", "Disable WWW service"],
              ["enable_api_service", "Enable API service"],
              ["enable_api_ssl_service", "Enable API SSL service"]
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 text-sm font-medium text-ink">
                <input type="checkbox" checked={Boolean(profile[key])} onChange={(event) => setValue(key, event.target.checked)} />
                {label}
              </label>
            ))}
          </div>

          {message ? <p className="text-sm text-muted">{message}</p> : null}

          <button className="btn" type="button" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save Network Profile"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

