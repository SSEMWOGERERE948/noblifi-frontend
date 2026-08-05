"use client";

import { useEffect, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { API_BASE_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";

type RouterRow = {
  id: string;
  name: string;
  management_ip?: string | null;
  wireguard_tunnel_ip?: string | null;
  wireguard_status?: string;
  status: string;
};

type RemoteAccess = {
  address: string;
  api_address: string;
  winbox_address: string;
  web_url: string;
  secure_web_url: string;
  method: string;
  wireguard_status: string;
  ready: boolean;
};

export default function RemoteAccessPage() {
  const [routers, setRouters] = useState<RouterRow[]>([]);
  const [details, setDetails] = useState<Record<string, RemoteAccess>>({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const response = await authedFetch("/api/v1/routers");
      if (!response.ok) {
        setMessage("Could not load routers.");
        return;
      }
      const data = (await response.json()) as RouterRow[];
      setRouters(data);
      const loaded: Record<string, RemoteAccess> = {};
      await Promise.all(data.map(async (router) => {
        const detailResponse = await authedFetch(`/api/v1/routers/${router.id}/remote-access`);
        if (detailResponse.ok) loaded[router.id] = await detailResponse.json();
      }));
      setDetails(loaded);
    }
    load();
  }, []);

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setMessage(`Copied ${value}`);
  }

  async function test(router: RouterRow) {
    setMessage(`Testing ${router.name}...`);
    const response = await authedFetch(`/api/v1/routers/${router.id}/test-connection`, { method: "POST" });
    setMessage(response.ok ? `${router.name} is reachable over RouterOS API.` : await readError(response, "Connection failed."));
  }

  async function enable(router: RouterRow) {
    setMessage(`Enabling VPN remote access for ${router.name}...`);
    const response = await authedFetch(`/api/v1/routers/${router.id}/remote-access/enable`, { method: "POST" });
    if (!response.ok) {
      setMessage(await readError(response, "Could not enable VPN remote access."));
      return;
    }
    const detail = (await response.json()) as RemoteAccess;
    setDetails((current) => ({ ...current, [router.id]: detail }));
    setMessage(`VPN remote access queued for ${router.name}. The public WebFig URL is ${detail.web_url}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Remote access" description="Use WireGuard or direct API addresses to manage routers remotely." />
      {message ? <div className="panel p-4 text-sm text-muted">{message}</div> : null}
      <section className="grid gap-4 xl:grid-cols-2">
        {routers.map((router) => {
          const detail = details[router.id];
          return (
            <div key={router.id} className="panel p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-ink">{router.name}</h2>
                  <p className="mt-1 text-sm text-muted">{detail?.method || "not configured"} - {router.status}</p>
                </div>
                <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-muted">{detail?.wireguard_status || router.wireguard_status || "pending"}</span>
              </div>
              <dl className="mt-5 grid gap-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-line pb-2">
                  <dt className="text-muted">Router address</dt>
                  <dd className="font-medium text-ink">{detail?.address || router.wireguard_tunnel_ip || router.management_ip || "Not ready"}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-line pb-2">
                  <dt className="text-muted">Winbox</dt>
                  <dd className="font-medium text-ink">{detail?.winbox_address || "Not ready"}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-line pb-2">
                  <dt className="text-muted">RouterOS API</dt>
                  <dd className="font-medium text-ink">{detail?.api_address || "Not ready"}</dd>
                </div>
              </dl>
              <div className="mt-5 flex flex-wrap gap-2">
                <button className="btn" type="button" onClick={() => enable(router)}>Enable VPN access</button>
                <button className="btn-secondary" type="button" disabled={!detail?.winbox_address} onClick={() => detail && copy(detail.winbox_address)}>Copy Winbox</button>
                <button className="btn-secondary" type="button" disabled={!detail?.web_url} onClick={() => detail && copy(detail.web_url)}>Copy WebFig URL</button>
                <button className="btn-secondary" type="button" disabled={!detail?.web_url} onClick={() => detail && window.open(detail.web_url, "_blank", "noopener,noreferrer")}>Open WebFig</button>
                <button className="btn-secondary" type="button" onClick={() => test(router)}>Test connection</button>
              </div>
            </div>
          );
        })}
        {routers.length === 0 ? <div className="panel p-6 text-sm text-muted">No routers found.</div> : null}
      </section>
    </div>
  );
}

async function authedFetch(path: string, init: RequestInit = {}) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken() || ""}`,
      ...init.headers
    },
    cache: "no-store"
  });
}

async function readError(response: Response, fallback: string) {
  const text = await response.text();
  if (!text) return fallback;
  try {
    const body = JSON.parse(text);
    return body.message || body.error || text;
  } catch {
    return text;
  }
}
