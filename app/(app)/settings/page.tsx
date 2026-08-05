"use client";

import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { API_BASE_URL } from "@/lib/api";
import { getSavedUser, getToken, saveSession } from "@/lib/auth";

export default function SettingsPage() {
  const savedUser = getSavedUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [portalName, setPortalName] = useState(savedUser?.portal_name || savedUser?.name || "");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match.");
      return;
    }
    setSubmitting(true);
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/change-password`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken() || ""}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      })
    });
    if (!response.ok) {
      setMessage(await response.text());
      setSubmitting(false);
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage("Password changed.");
    setSubmitting(false);
  }

  async function savePortalName() {
    setMessage("");
    const response = await fetch(`${API_BASE_URL}/api/v1/account/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${getToken() || ""}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ portal_name: portalName })
    });
    if (!response.ok) {
      setMessage(await response.text());
      return;
    }
    const body = await response.json();
    const token = getToken();
    if (token && body.user) {
      saveSession({ token, user: body.user });
    }
    setMessage("Portal name saved.");
  }

  return (
    <>
      <PageHeader title="Settings" description="Manage your account security." />
      <section className="panel mb-6 max-w-xl p-5">
        <h2 className="text-lg font-semibold text-ink">Captive portal name</h2>
        <p className="mt-1 text-sm text-muted">This is the default customer-facing WiFi name used when you create routers.</p>
        <label className="mt-4 block text-sm font-medium text-ink">
          Portal name
          <input className="field mt-2" value={portalName} onChange={(event) => setPortalName(event.target.value)} />
        </label>
        <button className="btn mt-4" type="button" onClick={savePortalName}>
          Save portal name
        </button>
      </section>
      <form onSubmit={submit} className="panel max-w-xl p-5">
        <h2 className="text-lg font-semibold text-ink">Change password</h2>
        <label className="mt-4 block text-sm font-medium text-ink">
          Current password
          <input className="field mt-2" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
        </label>
        <label className="mt-4 block text-sm font-medium text-ink">
          New password
          <input className="field mt-2" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={8} />
        </label>
        <label className="mt-4 block text-sm font-medium text-ink">
          Confirm new password
          <input className="field mt-2" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} />
        </label>
        <button className="btn mt-5" type="submit" disabled={submitting}>
          {submitting ? "Changing..." : "Change password"}
        </button>
        {message ? <p className="mt-3 text-sm text-muted">{message}</p> : null}
      </form>
    </>
  );
}
