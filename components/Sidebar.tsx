import Link from "next/link";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/routers", label: "Routers" },
  { href: "/usage-analytics", label: "Usage Analytics" },
  { href: "/sales", label: "Sales" },
  { href: "/users", label: "Users" },
  { href: "/plans", label: "Packages" },
  { href: "/transactions", label: "Transactions" },
  { href: "/vouchers", label: "Vouchers" },
  { href: "/settings", label: "Settings" }
];

export function Sidebar() {
  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-line bg-panel px-4 py-5">
      <Link href="/dashboard" className="mb-8 text-xl font-bold tracking-normal text-ink">
        NobliFi
      </Link>
      <nav className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-md px-3 py-2 text-sm font-medium text-muted transition hover:bg-soft hover:text-ink"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <ThemeSwitcher />
    </aside>
  );
}
