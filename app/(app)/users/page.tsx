"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { API_BASE_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  account_status: string;
  router_limit: number;
  router_limit_requested?: number | null;
};

type LimitRequest = {
  id: string;
  user_id: string;
  requested_limit: number;
  status: string;
  reason: string;
};

type AccountRouter = {
  id: string;
  name: string;
  site_name?: string | null;
  model?: string | null;
  serial_number?: string | null;
  status: string;
  routeros_version?: string | null;
};

type AccountDetails = {
  user: User;
  routers: AccountRouter[];
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<LimitRequest[]>([]);
  const [username, setUsername] = useState("");
  const [details, setDetails] = useState<AccountDetails | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const token = getToken();
    if (!token) {
      setMessage("Sign in as superadmin to manage users.");
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    const [userResponse, requestResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/api/v1/admin/users`, { headers }),
      fetch(`${API_BASE_URL}/api/v1/admin/router-limit-requests`, { headers })
    ]);
    if (!userResponse.ok) {
      setMessage("Only superadmins can manage users.");
      return;
    }
    setUsers(await userResponse.json());
    setRequests(requestResponse.ok ? await requestResponse.json() : []);
  }

  async function approve(user: User) {
    const token = getToken();
    const limit = Number(window.prompt("Router limit", String(user.router_limit || 3)) || user.router_limit || 3);
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${user.id}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ router_limit: limit })
    });
    setMessage(response.ok ? "User approved." : "Could not approve user.");
    load();
  }

  async function decide(request: LimitRequest, approved: boolean) {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/router-limit-requests/${request.id}/decide`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ approved })
    });
    setMessage(response.ok ? "Request updated." : "Could not update request.");
    load();
  }

  async function searchAccount() {
    setMessage("");
    setDetails(null);
    const token = getToken();
    const query = username.trim();
    if (!query) {
      setMessage("Enter a username or email to view account details.");
      return;
    }
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/account-details?username=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    if (!response.ok) {
      setMessage("No matching account was found.");
      return;
    }
    setDetails(await response.json());
  }

  return (
    <>
      <PageHeader title="Users" description="Approve client accounts and manage router capacity requests." />
      {message ? <div className="panel mb-4 p-4 text-sm text-muted">{message}</div> : null}

      <section className="panel mb-6 p-4">
        <h2 className="font-semibold text-ink">View account details</h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            className="field"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Search by username or email"
          />
          <button className="btn" type="button" onClick={searchAccount}>
            View account
          </button>
        </div>
        {details ? (
          <div className="mt-5">
            <div className="rounded-md border border-line p-3 text-sm">
              <p className="font-semibold text-ink">{details.user.name}</p>
              <p className="text-muted">{details.user.email} - {details.user.account_status} - router limit {details.user.router_limit}</p>
            </div>
            <div className="mt-3 overflow-hidden rounded-md border border-line">
              {details.routers.length ? (
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="border-b border-line bg-soft text-xs uppercase text-muted">
                    <tr>
                      <th className="px-4 py-3">Router</th>
                      <th className="px-4 py-3">Site</th>
                      <th className="px-4 py-3">Model</th>
                      <th className="px-4 py-3">Serial</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {details.routers.map((router) => (
                      <tr key={router.id}>
                        <td className="px-4 py-3 font-medium text-ink">{router.name}</td>
                        <td className="px-4 py-3 text-muted">{router.site_name ?? "-"}</td>
                        <td className="px-4 py-3 text-muted">{router.model ?? router.routeros_version ?? "Not linked"}</td>
                        <td className="px-4 py-3 text-muted">{router.serial_number ?? "Not linked"}</td>
                        <td className="px-4 py-3 text-muted">{router.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-4 text-sm text-muted">This account has no routers.</p>
              )}
            </div>
          </div>
        ) : null}
      </section>

      <section className="panel overflow-hidden">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line bg-soft text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Router limit</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">
                  <span className="block font-medium text-ink">{user.name}</span>
                  <span className="text-xs text-muted">{user.email}</span>
                </td>
                <td className="px-4 py-3 text-muted">{user.role}</td>
                <td className="px-4 py-3 text-muted">{user.account_status}</td>
                <td className="px-4 py-3 text-muted">{user.router_limit}</td>
                <td className="px-4 py-3">
                  {user.account_status !== "approved" ? (
                    <button className="btn-secondary" type="button" onClick={() => approve(user)}>
                      Approve
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel mt-6 overflow-hidden">
        <div className="border-b border-line p-4">
          <h2 className="font-semibold text-ink">Router limit requests</h2>
        </div>
        <div className="divide-y divide-line">
          {requests.length ? requests.map((request) => (
            <div key={request.id} className="flex items-center justify-between gap-4 p-4 text-sm">
              <div>
                <p className="font-medium text-ink">Requested limit: {request.requested_limit}</p>
                <p className="text-muted">{request.reason || "No reason provided"} - {request.status}</p>
              </div>
              {request.status === "pending" ? (
                <div className="flex gap-2">
                  <button className="btn-secondary" type="button" onClick={() => decide(request, false)}>Reject</button>
                  <button className="btn" type="button" onClick={() => decide(request, true)}>Accept</button>
                </div>
              ) : null}
            </div>
          )) : <p className="p-4 text-sm text-muted">No router limit requests.</p>}
        </div>
      </section>
    </>
  );
}
