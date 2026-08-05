"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { clearSession, getToken } from "@/lib/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const token = getToken();
      if (!token) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      }).catch(() => null);

      if (!response?.ok) {
        clearSession();
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      if (!cancelled) setAllowed(true);
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!allowed) {
    return <main className="min-h-screen bg-app p-6 text-sm text-muted">Checking session...</main>;
  }

  return <>{children}</>;
}
