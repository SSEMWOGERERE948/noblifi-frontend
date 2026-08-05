"use client";

import { useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";

export function RouterLimitRequestPanel() {
  const [requestedLimit, setRequestedLimit] = useState("4");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  async function submit() {
    const response = await fetch(`${API_BASE_URL}/api/v1/account/router-limit-requests`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken() || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ requested_limit: Number(requestedLimit), reason })
    });
    setMessage(response.ok ? "Request sent to superadmin." : await response.text());
  }

  return (
    <div className="panel mb-5 p-4">
      <div className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
        <input className="field" value={requestedLimit} onChange={(event) => setRequestedLimit(event.target.value)} inputMode="numeric" placeholder="New router limit" />
        <input className="field" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for increase" />
        <button className="btn-secondary" type="button" onClick={submit}>
          Request increase
        </button>
      </div>
      {message ? <p className="mt-2 text-sm text-muted">{message}</p> : null}
    </div>
  );
}
