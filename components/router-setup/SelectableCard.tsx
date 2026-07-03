import type { ReactNode } from "react";

export function SelectableCard({
  title,
  description,
  badge,
  selected,
  onSelect,
  children
}: {
  title: string;
  description: string;
  badge?: string;
  selected: boolean;
  onSelect: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`min-h-36 rounded-lg border p-5 text-left transition ${
        selected ? "border-cyan-300 bg-cyan-400/10" : "border-line bg-panel hover:border-cyan-600"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        {badge ? <span className="rounded-full bg-emerald-400 px-2 py-1 text-xs font-bold text-slate-950">{badge}</span> : null}
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </button>
  );
}

