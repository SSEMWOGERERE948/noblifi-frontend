import { API_BASE_URL } from "@/lib/api";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  hotspot_name: string;
  billing_plan: string;
  monthly_price_ugx: number;
  trial_ends_at: string | null;
  email_verified_at: string | null;
};

type AuthResponse = {
  token: string;
  user: AuthUser;
};

type CodeDelivery = {
  sent: boolean;
  dev_code?: string;
  message: string;
  smtp_enabled: boolean;
};

type SignupResponse = {
  message: string;
  user: AuthUser;
  delivery?: CodeDelivery;
};

const tokenKey = "noblifi_token";
const userKey = "noblifi_user";

export function saveSession(session: AuthResponse) {
  localStorage.setItem(tokenKey, session.token);
  localStorage.setItem(userKey, JSON.stringify(session.user));
}

export function getToken() {
  return localStorage.getItem(tokenKey);
}

export function getStoredUser() {
  const raw = localStorage.getItem(userKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem(userKey);
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
}

export async function login(email: string, password: string) {
  return authRequest("/api/v1/auth/login", { email, password });
}

export async function signup(name: string, email: string, password: string, hotspotName: string) {
  return request<SignupResponse>("/api/v1/auth/signup", {
    name,
    email,
    password,
    hotspot_name: hotspotName
  });
}

export async function verifyEmail(email: string, code: string) {
  return authRequest("/api/v1/auth/verify-email", { email, code });
}

export async function resendVerification(email: string) {
  return request<{ message: string; delivery?: CodeDelivery }>("/api/v1/auth/resend-verification", { email });
}

export async function requestPasswordReset(email: string) {
  return request<{ message: string }>("/api/v1/auth/request-password-reset", { email });
}

export async function resetPassword(email: string, code: string, password: string) {
  return request<{ message: string }>("/api/v1/auth/reset-password", { email, code, password });
}

async function authRequest(path: string, body: unknown) {
  return request<AuthResponse>(path, body);
}

async function request<T>(path: string, body: unknown) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(await responseErrorMessage(response));
  }

  return (await response.json()) as T;
}

async function responseErrorMessage(response: Response) {
  const text = await response.text();
  if (!text) {
    return "Authentication failed";
  }

  try {
    const body = JSON.parse(text) as { error?: string; message?: string };
    return body.error || body.message || text;
  } catch {
    return text;
  }
}
