"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export function DeleteRouterPanel({ routerId, routerName }: { routerId: string; routerName: string }) {
  const nav = useRouter();
  const [challenge, setChallenge] = useState<{ challenge_id: string; expected_confirmation: string; expires_at: string } | null>(null);
  const [typedName, setTypedName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestChallenge() {
    setBusy(true);
    setMessage("");
    try {
      const response = await apiFetch<{ challenge_id: string; expected_confirmation: string; expires_at: string }>(`/api/v1/routers/${routerId}/delete-challenge`, {
        method: "POST"
      });
      setChallenge(response);
      setTypedName("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not prepare router deletion.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteRouter() {
    if (!challenge) {
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await apiFetch<void>(`/api/v1/routers/${routerId}`, {
        method: "DELETE",
        body: JSON.stringify({ challenge_id: challenge.challenge_id, router_name: typedName })
      });
      nav.push("/routers");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not delete router.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel mt-6 p-5">
      <h2 className="text-lg font-semibold text-ink">Delete Router</h2>
      <p className="mt-2 text-sm text-muted">Copy the router name, then paste it once to confirm deletion.</p>
      {!challenge ? (
        <button className="btn-secondary mt-4" type="button" onClick={requestChallenge} disabled={busy}>
          Delete Router
        </button>
      ) : (
        <div className="mt-4 grid gap-3">
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-soft p-3">
            <code className="text-sm font-semibold text-ink">{challenge.expected_confirmation || routerName}</code>
            <button className="btn-secondary" type="button" onClick={() => navigator.clipboard.writeText(challenge.expected_confirmation || routerName)}>
              Copy
            </button>
          </div>
          <input className="field" value={typedName} onChange={(event) => setTypedName(event.target.value)} placeholder="Paste router name" />
          <button className="mt-3 rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={deleteRouter} disabled={busy || typedName.trim() !== (challenge.expected_confirmation || routerName)}>
            Delete router
          </button>
        </div>
      )}
      {message ? <p className="mt-3 text-sm text-muted">{message}</p> : null}
    </div>
  );
}
