import { API_BASE_URL } from "@/lib/api";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  account_status?: string;
  portal_name?: string;
};

type AuthResponse = {
  token: string;
  user: AuthUser;
};

const tokenKey = "noblifi_token";
const userKey = "noblifi_user";

export function saveSession(session: AuthResponse) {
  localStorage.setItem(tokenKey, session.token);
  localStorage.setItem(userKey, JSON.stringify(session.user));
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(tokenKey);
}

export function getSavedUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(userKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
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

export async function signup(name: string, email: string, password: string, portalName?: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, portal_name: portalName || name })
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json();
}

async function authRequest(path: string, body: unknown) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as AuthResponse;
}

async function readError(response: Response) {
  const text = await response.text();
  if (!text) return "Authentication failed";
  try {
    const body = JSON.parse(text);
    return body.message || body.error || text;
  } catch {
    return text;
  }
}

