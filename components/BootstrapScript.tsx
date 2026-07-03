import { bootstrapScript } from "@/lib/api";

export function BootstrapScript({ token }: { token: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-line bg-slate-950 p-4 text-xs leading-6 text-slate-100">
      {bootstrapScript(token)}
    </pre>
  );
}

