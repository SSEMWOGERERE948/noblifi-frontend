"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

type CreatedRouter = {
  id: string;
  name: string;
  claim_token: string;
};

export default function NewRouterPage() {
  const routerNav = useRouter();
  const [name, setName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [model, setModel] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const response = await fetch(`${API_BASE_URL}/api/v1/routers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, site_name: siteName, expected_model: model })
    });

    if (!response.ok) {
      setError("Router could not be created.");
      setSubmitting(false);
      return;
    }

    const created = (await response.json()) as CreatedRouter;
    routerNav.push(`/routers/${created.id}`);
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">Add Router</h1>
        <p className="mt-1 text-sm text-muted">Create the router record first. You can link the physical MikroTik from the router page after it is created.</p>
      </div>
      <form onSubmit={submit} className="panel p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm font-medium text-ink">
            Router name
            <input className="field mt-2" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="text-sm font-medium text-ink">
            Site name
            <input className="field mt-2" value={siteName} onChange={(e) => setSiteName(e.target.value)} required />
          </label>
          <label className="text-sm font-medium text-ink">
            Expected model
            <input className="field mt-2" value={model} onChange={(e) => setModel(e.target.value)} />
          </label>
        </div>
        <button className="btn mt-5" type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create Router"}
        </button>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </form>
    </div>
  );
}
