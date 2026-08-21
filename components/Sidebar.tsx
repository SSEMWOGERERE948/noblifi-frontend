"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { apiFetch } from "@/lib/api";
import { getStoredUser, getToken, type AuthUser } from "@/lib/auth";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: "D" },
  { href: "/routers", label: "Routers", icon: "R" },
  { href: "/usage-analytics", label: "Usage Analytics", icon: "U" },
  { href: "/support-hub", label: "Support Hub", icon: "H" },
  { href: "/sales", label: "Sales", icon: "$" },
  { href: "/wallet", label: "Wallet", icon: "W" },
  { href: "/float", label: "Float", icon: "F" },
  { href: "/agent-pos", label: "Agent POS", icon: "A" },
  { href: "/vouchers", label: "Vouchers", icon: "V" },
  { href: "/remote-access", label: "Remote Access", icon: "W" },
  { href: "/captive-templates", label: "Captive Templates", icon: "C" },
  { href: "/sms", label: "SMS", icon: "M" },
  { href: "/payment-gateways", label: "Payment Gateways", icon: "P" },
  { href: "/billing", label: "Billing", icon: "B" },
  { href: "/subscriptions", label: "Subscriptions", icon: "$" },
  { href: "/users", label: "Users", icon: "U" },
  { href: "/plans", label: "Plans & Pricing", icon: "P" }
];

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const token = getToken();
      if (!token) {
        setUser(getStoredUser());
        return;
      }

      try {
        const { user } = await apiFetch<{ user: AuthUser }>('/api/v1/auth/me');
        localStorage.setItem('noblifi_user', JSON.stringify(user));
        setUser(user);
      } catch {
        setUser(getStoredUser());
      }
    }

    loadUser();
  }, []);

  const visibleItems = useMemo(
    () => items.filter((item) => item.href !== "/users" || user?.role === "superadmin"),
    [user]
  );

  const navLinks = (onNavigate?: () => void) => (
    <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
      {visibleItems.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-md border-l-2 px-3 py-2.5 text-sm font-medium transition ${
              active ? "border-accent bg-emerald-400/10 text-accent" : "border-transparent text-muted hover:bg-soft hover:text-ink"
            }`}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-line text-xs">{item.icon}</span>
            <span className="min-w-0 truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const profileBlock = (
    <div className="mt-4 space-y-3 border-t border-line pt-4">
      <div className="rounded-md border border-line bg-soft/60 p-3">
        <p className="truncate font-semibold text-ink">{user?.name ?? "NobliFi Admin"}</p>
        <p className="text-xs text-muted">{user?.role ?? "admin"}</p>
      </div>
      <Link href="/login" className="block rounded-md border border-line px-3 py-2 text-sm text-muted hover:bg-soft hover:text-ink">
        Sign out
      </Link>
      <ThemeSwitcher />
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-panel/95 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3 text-lg font-bold tracking-normal text-ink">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-accent to-sky-400 text-xs font-black text-slate-950">NF</span>
          <span className="truncate">NobliFi</span>
        </Link>
        <button
          className="btn-secondary px-3 py-2"
          type="button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-black/60"
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-[min(22rem,86vw)] flex-col border-r border-line bg-panel px-5 py-5 shadow-2xl">
            <Link href="/dashboard" onClick={() => setOpen(false)} className="mb-6 flex items-center gap-3 text-xl font-bold tracking-normal text-ink">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-accent to-sky-400 text-sm font-black text-slate-950">NF</span>
              NobliFi
            </Link>
            <div className="mb-4 rounded-md border border-line bg-soft/60 p-3">
              <p className="text-xs uppercase text-muted">Workspace</p>
              <p className="mt-1 text-sm font-semibold text-ink">NobliFi Admin</p>
              <span className="mt-2 inline-block rounded bg-emerald-400/10 px-2 py-0.5 text-xs font-semibold text-accent">Admin</span>
            </div>
            {navLinks(() => setOpen(false))}
            {profileBlock}
          </aside>
        </div>
      ) : null}

      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-line bg-panel/80 px-5 py-5 backdrop-blur md:flex">
        <Link href="/dashboard" className="mb-6 flex items-center gap-3 text-xl font-bold tracking-normal text-ink">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-accent to-sky-400 text-sm font-black text-slate-950">NF</span>
          NobliFi
        </Link>
        <div className="mb-4 rounded-md border border-line bg-soft/60 p-3">
          <p className="text-xs uppercase text-muted">Workspace</p>
          <p className="mt-1 text-sm font-semibold text-ink">NobliFi Admin</p>
          <span className="mt-2 inline-block rounded bg-emerald-400/10 px-2 py-0.5 text-xs font-semibold text-accent">Admin</span>
        </div>
        {navLinks()}
        {profileBlock}
      </aside>
    </>
  );
}
