// export const API_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://noblifi.ew.r.appspot.com");
export const API_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8080");

type FetchOptions = RequestInit & {
  fallback?: unknown;
};

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { fallback, headers, ...init } = options;

  try {
    const requestHeaders = new Headers(headers);
    const token = typeof window !== "undefined" ? localStorage.getItem("noblifi_token") : null;

    if (!requestHeaders.has("Content-Type") && init.body) {
      requestHeaders.set("Content-Type", "application/json");
    }

    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: requestHeaders,
      cache: "no-store"
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("noblifi_token");
        localStorage.removeItem("noblifi_user");
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(parseApiErrorMessage(text, response.status));
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (fallback !== undefined) {
      return fallback as T;
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(`Unable to reach ${API_BASE_URL}${path}`);
  }
}

function parseApiErrorMessage(text: string, status: number) {
  if (!text) {
    return `Request failed with ${status}`;
  }

  try {
    const payload = JSON.parse(text) as { error?: string; message?: string };
    if (payload.error) return payload.error;
    if (payload.message) return payload.message;
  } catch {
    // Ignore JSON parse errors and fall back to the raw text.
  }

  return text;
}

function normalizeBaseUrl(url: string) {
  return url.trim().replace(/\/+$/, "");
}

function fetchModeFor(url: string) {
  if (url.startsWith("https://")) return "https";
  if (url.startsWith("http://")) return "http";

  // RouterOS /tool fetch requires a proper URL protocol.
  // Defaulting to https is safer for production, but the URL itself must still include https://.
  return "https";
}

export function bootstrapScript(token: string, baseUrl?: string) {
  const provisioningUrl = normalizeBaseUrl(
    baseUrl ??
      process.env.NEXT_PUBLIC_PROVISIONING_BASE_URL ??
      `${API_BASE_URL}/api/v1/provisioning`
  );
  const fetchMode = fetchModeFor(provisioningUrl);
  const bootstrapUrl = `${provisioningUrl}/bootstrap/${token}`;

  return `/tool fetch url="${bootstrapUrl}" mode=${fetchMode} dst-path=noblifi-bootstrap.rsc
/import file-name=noblifi-bootstrap.rsc`;
}
