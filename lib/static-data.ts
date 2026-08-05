export const currency = "UGX";

export const salesRows = [
  { code: "NF-8Q2K7A", channel: "voucher_portal", package: "Day Pass", payer: "+256701234111", name: "Grace N.", amount: 1500, created: "2026-08-05 13:37" },
  { code: "NF-3H9M2P", channel: "agent_pos", package: "24 Hours", payer: "+256702818404", name: "Walk-in Customer", amount: 2000, created: "2026-08-05 13:22" },
  { code: "NF-7T4V1C", channel: "mobile_checkout", package: "48 Hours", payer: "+256705551202", name: "Alice N.", amount: 3500, created: "2026-08-05 13:05" },
  { code: "NF-5R8B6D", channel: "voucher_portal", package: "Evening Bundle", payer: "", name: "Anonymous", amount: 1000, created: "2026-08-05 12:48" },
  { code: "NF-1X6J5L", channel: "reseller", package: "Weekly", payer: "+256781112233", name: "Branch Agent", amount: 12000, created: "2026-08-05 12:12" }
];

export const routerRows = [
  { id: "branch-core", name: "Branch Core", vendor: "MikroTik", model: "L009UiGS-2HaxD", version: "7.23.2", status: "online", cpu: 24, memory: 31, uptime: "18h 15m", users: 96, download: 74, upload: 12 },
  { id: "lobby-hotspot", name: "Lobby Hotspot", vendor: "MikroTik", model: "RB5009UG+S+", version: "7.22.1", status: "online", cpu: 12, memory: 27, uptime: "1d 20h", users: 141, download: 91, upload: 18 },
  { id: "annex-link", name: "Annex Link", vendor: "MikroTik", model: "hAP ax3", version: "7.20.8", status: "warning", cpu: 61, memory: 44, uptime: "6h 42m", users: 33, download: 38, upload: 9 }
];

export const usageByDay = [
  { label: "Aug 1", value: 384 },
  { label: "Aug 2", value: 296 },
  { label: "Aug 3", value: 512 },
  { label: "Aug 4", value: 433 },
  { label: "Aug 5", value: 617 }
];

export const revenueByDay = [
  { label: "Aug 1", value: 82000 },
  { label: "Aug 2", value: 64000 },
  { label: "Aug 3", value: 131000 },
  { label: "Aug 4", value: 97000 },
  { label: "Aug 5", value: 156000 }
];

export const limits = [
  { name: "Hotspots", current: 8, requested: 12, description: "Maximum hotspot locations this account can operate." },
  { name: "Routers", current: 3, requested: 6, description: "Physical routers that can be attached to the account." },
  { name: "Unused vouchers", current: 3000, requested: 5000, description: "Unredeemed voucher codes allowed per package." }
];
