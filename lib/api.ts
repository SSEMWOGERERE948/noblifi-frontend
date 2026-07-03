export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

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

  return `:global claimToken "${token}"
:global baseUrl "${provisioningUrl}"
:global fetchMode "${fetchMode}"

/system identity set name=("noblifi-pending-" . $claimToken)

:global serial [/system routerboard get serial-number]
:global model [/system routerboard get model]
:global version [/system resource get version]
:global ifaceJson ""

:foreach iface in=[/interface find] do={
  :local name [/interface get $iface name]
  :local type [/interface get $iface type]
  :local mac ""

  :do {
    :set mac [/interface get $iface mac-address]
  } on-error={
    :set mac ""
  }

  :local running [/interface get $iface running]
  :local disabled [/interface get $iface disabled]

  :if ([:len $ifaceJson] > 0) do={
    :set ifaceJson ($ifaceJson . ",")
  }

  :set ifaceJson ($ifaceJson . "{\\"name\\":\\"" . $name . "\\",\\"type\\":\\"" . $type . "\\",\\"mac_address\\":\\"" . $mac . "\\",\\"running\\":" . $running . ",\\"disabled\\":" . $disabled . "}")
}

:global payload ("{\\"claim_token\\":\\"" . $claimToken . "\\",\\"serial_number\\":\\"" . $serial . "\\",\\"model\\":\\"" . $model . "\\",\\"routeros_version\\":\\"" . $version . "\\",\\"interfaces\\":[" . $ifaceJson . "]}")

:global checkInUrl ($baseUrl . "/check-in")
:global statusUrl ($baseUrl . "/status?token=" . $claimToken . "&serial=" . $serial . "&status=linked")

:put ("NobliFi check-in URL: " . $checkInUrl)
:put ("NobliFi status URL: " . $statusUrl)

/tool fetch url=$checkInUrl mode=$fetchMode http-method=post http-header-field="Content-Type: application/json" http-data=$payload keep-result=no

/tool fetch url=$statusUrl mode=$fetchMode keep-result=no

:put "NobliFi router linked. Return to the dashboard and choose automatic or manual setup."`;
}