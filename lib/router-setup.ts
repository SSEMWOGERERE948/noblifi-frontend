import { apiFetch } from "@/lib/api";

export type InterfaceInfo = {
  name: string;
  type?: string;
  running: boolean;
  disabled: boolean;
};

export type Assignment = {
  interface: string;
  role: string;
};

export type ConfigPreview = {
  summary: Record<string, string[]>;
  script: string;
};

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined
  });
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: "PUT",
    body: JSON.stringify(body)
  });
}

export async function apiGet<T>(path: string): Promise<T> {
  return apiFetch<T>(path);
}
