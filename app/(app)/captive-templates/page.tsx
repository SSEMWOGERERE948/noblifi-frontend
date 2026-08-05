import { PageHeader } from "@/components/PageHeader";

const templates = [
  {
    key: "clean",
    name: "Clean Access",
    palette: "from-sky-500 to-emerald-400",
    description: "A direct voucher-first portal for shops, offices, and small public hotspots.",
    headline: "Fast WiFi Access"
  },
  {
    key: "fresh",
    name: "Fresh Market",
    palette: "from-emerald-400 to-cyan-300",
    description: "Bright and friendly styling for cafes, salons, clinics, and community spaces.",
    headline: "Welcome Online"
  },
  {
    key: "sunrise",
    name: "Sunrise Lounge",
    palette: "from-amber-300 to-rose-400",
    description: "Warm premium styling for restaurants, hotels, lounges, and event venues.",
    headline: "Guest WiFi"
  },
  {
    key: "royal",
    name: "Royal Night",
    palette: "from-violet-300 to-sky-400",
    description: "Dark polished styling for bars, lounges, and evening venues.",
    headline: "Connect Securely"
  }
];

export default function CaptiveTemplatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Captive templates"
        description="Example captive portal styles clients can use on router network profiles."
      />

      <section className="grid gap-5 xl:grid-cols-2">
        {templates.map((template) => (
          <div key={template.key} className="panel overflow-hidden">
            <div className={`bg-gradient-to-br ${template.palette} p-6 text-[#06111f]`}>
              <div className="mx-auto max-w-sm rounded-lg bg-white/90 p-5 shadow-xl">
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-md bg-[#06111f] text-sm font-black text-white">NF</div>
                <h2 className="text-2xl font-semibold">{template.headline}</h2>
                <p className="mt-2 text-sm text-slate-700">Enter your voucher code or choose a package to get connected.</p>
                <div className="mt-5 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-600">Voucher code</div>
                <div className="mt-3 rounded-md bg-[#06111f] px-4 py-3 text-center text-sm font-semibold text-white">Connect</div>
                <p className="mt-4 text-center text-xs text-slate-600">Powered by NobliFi</p>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-ink">{template.name}</h3>
                  <p className="mt-2 text-sm text-muted">{template.description}</p>
                </div>
                <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-muted">{template.key}</span>
              </div>
              <p className="mt-4 text-sm text-muted">Use this by selecting <span className="font-semibold text-ink">{template.name}</span> in a router Network Profile.</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
