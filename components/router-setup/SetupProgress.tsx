const steps = [
  { key: "remote_access", label: "Remote Access" },
  { key: "method", label: "Method" },
  { key: "service_setup", label: "Service Setup" }
];

const order: Record<string, number> = {
  remote_access: 0,
  method: 1,
  topology: 2,
  manual: 2,
  preview: 2
};

export function SetupProgress({ current }: { current: "remote_access" | "method" | "topology" | "manual" | "preview" }) {
  const currentIndex = order[current];

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-panel p-4">
      {steps.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <div key={step.key} className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${
                done
                  ? "border-emerald-400 bg-emerald-400 text-slate-950"
                  : active
                    ? "border-cyan-300 text-cyan-200"
                    : "border-line text-muted"
              }`}
            >
              {done ? "✓" : index + 1}
            </div>
            <span className={active ? "text-sm font-semibold text-ink" : "text-sm text-muted"}>{step.label}</span>
            {index < steps.length - 1 ? <span className="text-muted">→</span> : null}
          </div>
        );
      })}
    </div>
  );
}

