"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";

export function DeleteRouterPanel({ routerId, routerName }: { routerId: string; routerName: string }) {
  const nav = useRouter();
  const [typedName, setTypedName] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestCode() {
    setBusy(true);
    setMessage("");
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/confirmation-codes`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken() || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_router" })
    });
    const body = await response.json().catch(() => null);
    setMessage(body?.dev_code ? `Confirmation code: ${body.dev_code}` : body?.message || "Confirmation code requested.");
    setBusy(false);
  }

  async function deleteRouter() {
    setBusy(true);
    setMessage("");
    const response = await fetch(`${API_BASE_URL}/api/v1/routers/${routerId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken() || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ typed_name: typedName, code })
    });
    if (!response.ok) {
      setMessage(await response.text());
      setBusy(false);
      return;
    }
    nav.push("/routers");
  }

  return (
    <div className="panel mt-6 p-5">
      <h2 className="text-lg font-semibold text-ink">Delete Router</h2>
      <p className="mt-2 text-sm text-muted">Request a confirmation code, then type the router name exactly: {routerName}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <input className="field" value={typedName} onChange={(event) => setTypedName(event.target.value)} placeholder={routerName} />
        <input className="field" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Email code" />
        <button className="btn-secondary" type="button" onClick={requestCode} disabled={busy}>
          Get code
        </button>
      </div>
      <button className="mt-3 rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white" type="button" onClick={deleteRouter} disabled={busy || typedName !== routerName || !code}>
        Delete router
      </button>
      {message ? <p className="mt-3 text-sm text-muted">{message}</p> : null}
    </div>
  );
}
