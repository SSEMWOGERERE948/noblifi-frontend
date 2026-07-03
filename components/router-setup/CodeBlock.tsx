"use client";

import { useState } from "react";

export function CodeBlock({ code, filename }: { code: string; filename?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function download() {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename ?? "noblifi-config.rsc";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <span className="text-xs font-semibold uppercase text-slate-400">{filename ?? "script"}</span>
        <div className="flex gap-2">
          <button type="button" className="rounded-md border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-100" onClick={copy}>
            {copied ? "Copied" : "Copy"}
          </button>
          {filename ? (
            <button type="button" className="rounded-md border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-100" onClick={download}>
              Download
            </button>
          ) : null}
        </div>
      </div>
      <pre className="max-h-[520px] overflow-auto p-4 text-xs leading-6 text-slate-100">{code}</pre>
    </div>
  );
}

