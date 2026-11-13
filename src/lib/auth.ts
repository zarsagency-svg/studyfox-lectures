"use client";

const KEY = "sp_auth";

export type AuthUser = {
  phone: string;
  name?: string;
  accessToken?: string;
  membership?: string;
};

export function getAuth(): AuthUser | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.phone) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setAuth(user: AuthUser) {
  try {
    localStorage.setItem(KEY, JSON.stringify(user));
  } catch {}
}

export function clearAuth() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

export function authHeaders(): Record<string, string> {
  const user = getAuth();
  if (user?.accessToken) return { Authorization: `Bearer ${user.accessToken}` };
  return {};
}
