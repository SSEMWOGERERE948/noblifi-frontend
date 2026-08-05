"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { clearSession, getSavedUser } from "@/lib/auth";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/routers", label: "Routers" },
  { href: "/usage-analytics", label: "Usage Analytics" },
  { href: "/support", label: "Support Hub" },
  { href: "/sales", label: "Sales" },
  { href: "/float", label: "Float" },
  { href: "/users", label: "Users" },
  { href: "/plans", label: "Packages" },
  { href: "/transactions", label: "Transactions" },
  { href: "/disbursements", label: "Disbursements" },
  { href: "/agent-pos", label: "Agent POS" },
  { href: "/vouchers", label: "Vouchers" },
  { href: "/remote-access", label: "Remote Access" },
  { href: "/captive-templates", label: "Captive Templates" },
  { href: "/sms", label: "SMS" },
  { href: "/payment-gateways", label: "Payment Gateways" },
  { href: "/billing", label: "Billing" },
  { href: "/limits", label: "Features & Limits" },
  { href: "/settings", label: "Settings" }
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const user = getSavedUser();

  function logout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col border-r border-line bg-panel px-4 py-5">
      <Link href="/dashboard" className="mb-6 flex items-center gap-3 text-xl font-bold tracking-normal text-ink">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-[var(--accent)] text-sm font-black text-[#06111f]">NF</span>
        <span>NobliFi</span>
      </Link>
      <div className="mb-4 rounded-md border border-line bg-soft px-3 py-3">
        <p className="text-xs uppercase tracking-wide text-muted">Workspace</p>
        <p className="mt-1 text-sm font-semibold text-ink">{user?.name || "Demo Account"}</p>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
              pathname === item.href ? "bg-soft text-ink" : "text-muted hover:bg-soft hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto border-t border-line pt-4">
        {user ? (
          <div className="mb-3 text-xs text-muted">
            <p className="font-semibold text-ink">{user.name}</p>
            <p>{user.role}</p>
          </div>
        ) : null}
        <button className="w-full rounded-md border border-line px-3 py-2 text-left text-sm font-medium text-muted hover:bg-soft hover:text-ink" type="button" onClick={logout}>
          Sign out
        </button>
      </div>
      <ThemeSwitcher />
    </aside>
  );
}
