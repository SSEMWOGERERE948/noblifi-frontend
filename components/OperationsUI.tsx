import type { ReactNode } from "react";

export type Metric = {
  label: string;
  value: string;
  detail?: string;
  change?: string;
  negative?: boolean;
  icon?: ReactNode;
};

export type Row = Record<string, ReactNode>;

export function OperationsTitle({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-accent">NobliFi Operations</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <DateRange />
        {action}
      </div>
    </header>
  );
}

export function DateRange() {
  return <div className="rounded-md border border-line bg-panel px-4 py-2 text-sm text-ink">Aug 1, 2026 - Aug 5, 2026</div>;
}

export function MetricGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} metric={metric} />
      ))}
    </section>
  );
}

export function MetricCard({ metric }: { metric: Metric }) {
  return (
    <div className="panel min-h-36 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="metric-icon flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold">{metric.icon ?? "NF"}</div>
        <div className="h-12 w-16 rounded-full bg-soft opacity-50" />
      </div>
      <p className="mt-4 text-sm text-muted">{metric.label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{metric.value}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        {metric.change ? (
          <span className={`rounded-md border px-2 py-1 font-semibold ${metric.negative ? "border-red-500/40 bg-red-500/10 text-red-400" : "border-emerald-400/30 bg-emerald-400/10 text-accent"}`}>
            {metric.negative ? "Down " : "Up "}
            {metric.change}
          </span>
        ) : null}
        {metric.detail ? <span className="text-muted">{metric.detail}</span> : null}
      </div>
    </div>
  );
}

export function TrendPanel({
  title,
  description,
  points,
  footer
}: {
  title: string;
  description?: string;
  points: { label: string; value: number; display: string }[];
  footer?: ReactNode;
}) {
  const max = Math.max(...points.map((point) => point.value), 1);

  return (
    <section className="panel p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        </div>
        <button className="btn-secondary px-3 py-1.5" type="button">Daily</button>
      </div>
      <div className="flex h-60 items-end gap-5 border-b border-line px-2 pb-6">
        {points.map((point) => (
          <div key={point.label} className="flex h-full flex-1 flex-col justify-end">
            <span className="mb-2 self-center rounded-md border border-line bg-panel px-2 py-1 text-xs text-ink">{point.display}</span>
            <div
              className="min-h-8 rounded-t-md border border-accent/40 bg-gradient-to-t from-emerald-950/40 to-accent/80"
              style={{ height: `${Math.max(16, (point.value / max) * 78)}%` }}
            />
            <span className="mt-3 text-center text-xs text-muted">{point.label}</span>
          </div>
        ))}
      </div>
      {footer ? <div className="mt-5">{footer}</div> : null}
    </section>
  );
}

export function RecentPanel({
  title,
  items
}: {
  title: string;
  items: { title: string; subtitle: string; meta: string; value?: string; status?: string; negative?: boolean }[];
}) {
  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <button className="btn-secondary px-3 py-1.5" type="button">View all</button>
      </div>
      <div className="divide-y divide-line">
        {items.map((item) => (
          <div key={`${item.title}-${item.meta}`} className="grid gap-2 py-3 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center">
            <div>
              <p className="font-semibold text-ink">{item.title}</p>
              <p className="text-xs text-muted">{item.subtitle}</p>
            </div>
            <span className="text-muted">{item.meta}</span>
            {item.value ? <span className={item.negative ? "font-semibold text-red-400" : "font-semibold text-accent"}>{item.value}</span> : <StatusBadge label={item.status ?? "Active"} />}
          </div>
        ))}
      </div>
    </section>
  );
}

export function DataTable({ columns, rows }: { columns: string[]; rows: Row[] }) {
  return (
    <div className="panel overflow-hidden">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-line bg-soft/60 text-xs uppercase text-muted">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-soft/60">
              {columns.map((column) => (
                <td key={column} className="px-4 py-3 text-muted">{row[column]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatusBadge({ label }: { label: string }) {
  const tone = label.toLowerCase();
  const color = tone.includes("overdue") || tone.includes("failed")
    ? "border-red-500/40 bg-red-500/10 text-red-400"
    : tone.includes("due") || tone.includes("warning") || tone.includes("low")
      ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
      : "border-emerald-400/30 bg-emerald-400/10 text-accent";
  return <span className={`status-pill ${color}`}>{label}</span>;
}

export function PageActions({ label }: { label: string }) {
  return (
    <>
      <button className="btn-secondary" type="button">Refresh</button>
      <button className="btn" type="button">{label}</button>
    </>
  );
}

export function OperationsPage({
  title,
  description,
  actionLabel,
  metrics,
  trendTitle,
  trendDescription,
  points,
  recentTitle,
  recent,
  tableTitle,
  columns,
  rows
}: {
  title: string;
  description: string;
  actionLabel: string;
  metrics: Metric[];
  trendTitle: string;
  trendDescription?: string;
  points: { label: string; value: number; display: string }[];
  recentTitle: string;
  recent: { title: string; subtitle: string; meta: string; value?: string; status?: string; negative?: boolean }[];
  tableTitle: string;
  columns: string[];
  rows: Row[];
}) {
  return (
    <>
      <OperationsTitle title={title} description={description} action={<PageActions label={actionLabel} />} />
      <MetricGrid metrics={metrics} />
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_1fr]">
        <TrendPanel title={trendTitle} description={trendDescription} points={points} />
        <RecentPanel title={recentTitle} items={recent} />
      </div>
      <section className="mt-5">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-ink">{tableTitle}</h2>
          <div className="flex gap-2">
            <input className="field w-full sm:w-64" placeholder="Search..." />
            <button className="btn-secondary" type="button">Filters</button>
            <button className="btn-secondary" type="button">Export</button>
          </div>
        </div>
        <DataTable columns={columns} rows={rows} />
      </section>
    </>
  );
}
