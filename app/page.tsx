import Link from "next/link";

const features = [
  ["WiFi HotSpot Management", "Operate MikroTik HotSpot networks with captive portal access, vouchers, and package rules."],
  ["Router Provisioning", "Generate setup flows for routers, ports, DHCP, RADIUS, and supported remote management."],
  ["Branded Captive Portals", "Present customers with a tenant-branded login and package purchase experience."],
  ["Packages and Vouchers", "Create timed packages with speed limits, optional data allowances, and printable vouchers."],
  ["Online WiFi Purchases", "Let customers buy access from the captive portal when payment configuration is enabled."],
  ["Sessions and Analytics", "Monitor routers, subscribers, payments, usage, and network status from one account."]
];

const steps = [
  "Connect your MikroTik router",
  "Configure WiFi packages",
  "NobliFi creates your captive portal",
  "Customers connect with vouchers or purchases",
  "RADIUS applies time, speed, and data rules",
  "Monitor activity from your dashboard"
];

const useCases = [
  "Hotels & Lodges",
  "Restaurants & Cafes",
  "Apartments",
  "Schools",
  "Offices",
  "Shopping Centres",
  "Events",
  "Public WiFi Operators",
  "Internet Resellers"
];

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-app text-ink">
      <header className="border-b border-line bg-panel/70 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4">
          <Link href="/" className="text-xl font-black tracking-normal text-ink">NobliFi</Link>
          <div className="hidden items-center gap-6 text-sm text-muted md:flex">
            <a href="#features">Features</a>
            <a href="#how">How It Works</a>
            <a href="#solutions">Solutions</a>
            <a href="#packages">Packages</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary">Sign In</Link>
            <Link href="/signup" className="btn">Get Started</Link>
          </div>
        </nav>
      </header>

      <section className="border-b border-line">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-brand">Managed WiFi for modern businesses</p>
            <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-normal md:text-6xl">
              Smart WiFi Management for Modern Businesses
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
              NobliFi helps businesses operate and monetize managed WiFi networks using MikroTik routers, captive portals, vouchers, packages, payments, and analytics.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="btn px-5 py-3">Get Started</Link>
              <Link href="/login" className="btn-secondary px-5 py-3">Sign In</Link>
            </div>
            <p className="mt-6 text-sm text-muted">Manage routers, sell WiFi packages, issue vouchers, and monitor your network from one platform.</p>
          </div>
          <div className="panel p-5">
            <div className="grid gap-3">
              {["Router online", "Captive portal ready", "RADIUS policies synced", "Vouchers available", "Payments enabled"].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-md border border-line bg-soft px-4 py-3">
                  <span className="text-sm font-semibold">{item}</span>
                  <span className="text-xs font-bold text-brand">Active</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-5 py-16">
        <h2 className="text-3xl font-black tracking-normal">What NobliFi Does</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map(([title, description]) => (
            <article key={title} className="panel p-5">
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how" className="border-y border-line bg-panel/45">
        <div className="mx-auto max-w-7xl px-5 py-16">
          <h2 className="text-3xl font-black tracking-normal">How It Works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step} className="flex gap-4 rounded-lg border border-line bg-app p-5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-soft text-sm font-black text-brand">{index + 1}</span>
                <p className="pt-1 text-sm font-semibold leading-6">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="solutions" className="mx-auto max-w-7xl px-5 py-16">
        <h2 className="text-3xl font-black tracking-normal">Business Use Cases</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((item) => (
            <div key={item} className="rounded-lg border border-line bg-panel px-4 py-4 text-sm font-semibold">{item}</div>
          ))}
        </div>
      </section>

      <section id="packages" className="border-y border-line bg-panel/45">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-black tracking-normal">Captive Portals and Packages</h2>
            <p className="mt-4 leading-7 text-muted">
              Give customers a branded login experience with configurable packages, voucher access, package duration, download and upload speed limits, optional data allowance, device binding, reconnect with remaining allowance, and payment-supported access when configured.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-normal">Management</h2>
            <p className="mt-4 leading-7 text-muted">
              Business owners can manage routers, packages, vouchers, active users, sessions, usage, payments, and network status from their NobliFi account.
            </p>
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-7xl px-5 py-16 text-center">
        <h2 className="text-4xl font-black tracking-normal">Run Your WiFi with NobliFi</h2>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/signup" className="btn px-5 py-3">Create Account</Link>
          <Link href="/login" className="btn-secondary px-5 py-3">Sign In</Link>
        </div>
      </section>

      <footer className="border-t border-line bg-panel">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-base font-black text-ink">NobliFi</p>
            <p>WiFi management platform</p>
          </div>
          <div className="flex flex-wrap gap-5">
            <Link href="/">Home</Link>
            <Link href="/login">Sign In</Link>
            <Link href="/signup">Get Started</Link>
          </div>
          <p>(c) {year} NobliFi</p>
        </div>
      </footer>
    </main>
  );
}
