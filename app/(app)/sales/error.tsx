"use client";

export default function SalesError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="panel p-6">
      <h1 className="text-xl font-semibold text-ink">Sales could not load</h1>
      <p className="mt-2 text-sm text-muted">
        The sales dashboard hit a client-side rendering problem. Try reloading the data.
      </p>
      <p className="mt-3 rounded-md border border-line bg-soft p-3 text-xs text-muted">
        {error.message || "Unknown sales page error"}
      </p>
      <button className="btn mt-4" type="button" onClick={reset}>
        Retry
      </button>
    </section>
  );
}
