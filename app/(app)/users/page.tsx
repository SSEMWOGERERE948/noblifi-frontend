"use client";

import { useEffect, useState } from "react";
import { DataTable, EmptyState, OperationsTitle, StatusBadge } from "@/components/OperationsUI";
import { apiFetch } from "@/lib/api";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<User[]>("/api/v1/users")
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load users."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <OperationsTitle title="Users" description="Superadmin view of all NobliFi user accounts." />
      {loading ? <p className="text-sm text-muted">Loading users...</p> : null}
      {error ? <p className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</p> : null}
      {!loading && !error && users.length ? (
        <DataTable
          columns={["Name", "Email", "Role", "Created"]}
          rows={users.map((user) => ({
            Name: user.name,
            Email: user.email,
            Role: <StatusBadge label={user.role} />,
            Created: user.created_at ? new Date(user.created_at).toLocaleString() : "-"
          }))}
        />
      ) : null}
      {!loading && !error && !users.length ? <EmptyState title="No users found" description="No user records were returned by the API." /> : null}
    </>
  );
}
