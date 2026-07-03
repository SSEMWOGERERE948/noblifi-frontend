import type { ReactNode } from "react";
import { SetupProgress } from "@/components/router-setup/SetupProgress";

export function SetupShell({
  title,
  description,
  current,
  children
}: {
  title: string;
  description: string;
  current: "remote_access" | "method" | "topology" | "manual" | "preview";
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl">
      <SetupProgress current={current} />
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-ink">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{description}</p>
      </div>
      {children}
    </div>
  );
}

