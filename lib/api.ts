export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

type FetchOptions = RequestInit & {
  fallback?: unknown;
};

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
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

export function bootstrapScript(token: string, baseUrl?: string) {
  const provisioningUrl =
    baseUrl ?? process.env.NEXT_PUBLIC_PROVISIONING_BASE_URL ?? `${API_BASE_URL}/api/v1/provisioning`;

  return `:local claimToken "${token}"
:local baseUrl "${provisioningUrl}"

/system identity set name=("noblifi-pending-" . $claimToken)

:local serial [/system routerboard get serial-number]
:local model [/system routerboard get model]
:local version [/system resource get version]
:local ifaceJson ""

:foreach iface in=[/interface find] do={
  :local name [/interface get $iface name]
  :local type [/interface get $iface type]
  :local mac [/interface get $iface mac-address]
  :local running [/interface get $iface running]
  :local disabled [/interface get $iface disabled]
  :if ([:len $ifaceJson] > 0) do={ :set ifaceJson ($ifaceJson . ",") }
  :set ifaceJson ($ifaceJson . "{\"name\":\"" . $name . "\",\"type\":\"" . $type . "\",\"mac_address\":\"" . $mac . "\",\"running\":" . $running . ",\"disabled\":" . $disabled . "}")
}

:local payload ("{\"claim_token\":\"" . $claimToken . "\",\"serial_number\":\"" . $serial . "\",\"model\":\"" . $model . "\",\"routeros_version\":\"" . $version . "\",\"interfaces\":[" . $ifaceJson . "]}")
/tool fetch url=($baseUrl . "/check-in") http-method=post http-header-field="Content-Type: application/json" http-data=$payload keep-result=no
/tool fetch url=($baseUrl . "/status?token=" . $claimToken . "&serial=" . $serial . "&status=linked") mode=http keep-result=no

:put "NobliFi router linked. Return to the dashboard and choose automatic or manual setup."`;
}

