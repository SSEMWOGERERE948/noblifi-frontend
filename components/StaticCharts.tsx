type Point = {
  label: string;
  value: number;
};

export function BarChart({ data, suffix = "" }: { data: Point[]; suffix?: string }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="flex h-72 items-end gap-4 border-b border-line px-2 pt-8">
      {data.map((item) => (
        <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-3">
          <div className="flex h-52 w-full items-end rounded-t-md bg-soft">
            <div
              className="w-full rounded-t-md bg-[var(--accent)]"
              style={{ height: `${Math.max(8, (item.value / max) * 100)}%` }}
              title={`${item.value.toLocaleString()}${suffix}`}
            />
          </div>
          <span className="text-xs text-muted">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function LineChart({ data, label }: { data: Point[]; label: string }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  const points = data.map((item, index) => {
    const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
    const y = 92 - (item.value / max) * 76;
    return `${x},${y}`;
  });

  return (
    <div className="h-72 rounded-md border border-line bg-soft p-4">
      <svg viewBox="0 0 100 100" className="h-full w-full" role="img" aria-label={label} preserveAspectRatio="none">
        <polyline points={points.join(" ")} fill="none" stroke="var(--brand)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        {data.map((item, index) => {
          const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
          const y = 92 - (item.value / max) * 76;
          return <circle key={item.label} cx={x} cy={y} r="1.7" fill="var(--accent)" />;
        })}
      </svg>
      <div className="mt-2 grid grid-cols-5 gap-2 text-center text-xs text-muted">
        {data.map((item) => <span key={item.label}>{item.label}</span>)}
      </div>
    </div>
  );
}
