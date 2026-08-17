import { apiFetch } from "@/lib/api";

/**
 * Standard API error used by the router setup pages.
 */
export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(
    message: string,
    status = 500,
    data?: unknown
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.data = data;

    Object.setPrototypeOf(
      this,
      ApiError.prototype
    );
  }
}

/**
 * MikroTik/router interface information.
 */
export type InterfaceInfo = {
  name: string;
  type?: string;
  running: boolean;
  disabled: boolean;
};

/**
 * Router interface role assignment.
 */
export type Assignment = {
  interface: string;
  role: string;
};

/**
 * Generated router configuration preview.
 */
export type ConfigPreview = {
  summary: Record<string, string[]>;
  script: string;
};

/**
 * WireGuard remote-access setup information returned
 * by the NobliFi backend.
 *
 * Explicitly typing arrays such as `issues` prevents
 * implicit-any errors when using `.map(...)` in TSX.
 */
export type WireGuardSetup = {
  enabled?: boolean;
  configured?: boolean;
  ready?: boolean;
  available?: boolean;

  status?: string;
  message?: string;

  /**
   * Any missing or invalid WireGuard/VPS configuration.
   *
   * Example:
   * wireGuard.issues.map((issue) => ...)
   *
   * `issue` is now correctly inferred as string.
   */
  issues?: string[];

  /**
   * WireGuard interface details.
   */
  interface_name?: string;
  private_key?: string;
  public_key?: string;

  /**
   * VPS/server WireGuard details.
   */
  server_public_key?: string;
  server_private_key?: string;
  server_endpoint?: string;
  server_address?: string;

  /**
   * Router/client WireGuard details.
   */
  client_public_key?: string;
  client_private_key?: string;
  client_address?: string;

  /**
   * Generic endpoint/address aliases used by some
   * backend responses.
   */
  endpoint?: string;
  address?: string;

  listen_port?: number;
  server_port?: number;

  allowed_ips?: string[];
  dns?: string[];

  persistent_keepalive?: number;

  /**
   * Generated setup/configuration content.
   */
  script?: string;
  bootstrap_script?: string;
  config?: string;

  /**
   * Optional environment/configuration data returned
   * by the backend.
   */
  required_env?: string[];
  missing_env?: string[];
  commands?: string[];
  steps?: string[];

  /**
   * Keep compatibility with additional backend fields
   * while the WireGuard API is still evolving.
   *
   * Important fields used with array methods should
   * still be explicitly typed above.
   */
  [key: string]: any;
};

/**
 * Normalize errors from apiFetch into ApiError so router
 * setup pages can reliably use:
 *
 * if (error instanceof ApiError) { ... }
 */
function normalizeApiError(
  error: unknown
): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    const possibleError = error as Error & {
      status?: number;
      statusCode?: number;
      data?: unknown;
      response?: {
        status?: number;
        data?: unknown;
      };
    };

    const status =
      possibleError.status ??
      possibleError.statusCode ??
      possibleError.response?.status ??
      500;

    const data =
      possibleError.data ??
      possibleError.response?.data;

    return new ApiError(
      possibleError.message ||
        "Router API request failed.",
      status,
      data
    );
  }

  return new ApiError(
    "Router API request failed.",
    500,
    error
  );
}

/**
 * GET helper.
 */
export async function apiGet<T>(
  path: string
): Promise<T> {
  try {
    return await apiFetch<T>(path);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

/**
 * POST helper.
 */
export async function apiPost<T>(
  path: string,
  body?: unknown
): Promise<T> {
  try {
    return await apiFetch<T>(path, {
      method: "POST",
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined
    });
  } catch (error) {
    throw normalizeApiError(error);
  }
}

/**
 * PUT helper.
 */
export async function apiPut<T>(
  path: string,
  body: unknown
): Promise<T> {
  try {
    return await apiFetch<T>(path, {
      method: "PUT",
      body: JSON.stringify(body)
    });
  } catch (error) {
    throw normalizeApiError(error);
  }
}