export const API_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://noblifi.uc.r.appspot.com");

type FetchOptions = RequestInit & {
  fallback?: unknown;
};

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { fallback, headers, ...init } = options;

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...headers
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    return (await response.json()) as T;
  } catch {
    if (fallback !== undefined) {
      return fallback as T;
    }

    throw new Error(`Unable to reach ${API_BASE_URL}${path}`);
  }
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

  return `/tool fetch url="${bootstrapUrl}" mode=${fetchMode} dst-path="noblifi-bootstrap.rsc"; :delay 2s; /import file-name="noblifi-bootstrap.rsc"; :delay 1s; /file remove "noblifi-bootstrap.rsc"`;
}
