import { API_BASE_URL } from "@/lib/api";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
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
  return localStorage.getItem(tokenKey);
}

export function clearSession() {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
}

export async function login(email: string, password: string) {
  return authRequest("/api/v1/auth/login", { email, password });
}

export async function signup(name: string, email: string, password: string) {
  return authRequest("/api/v1/auth/signup", { name, email, password });
}

async function authRequest(path: string, body: unknown) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Authentication failed");
  }

  return (await response.json()) as AuthResponse;
}

