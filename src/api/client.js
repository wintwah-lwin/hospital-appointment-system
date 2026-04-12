// API URL: set VITE_API_BASE_URL in root .env (same file as server; see .env.example)
export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

const BASE = API_BASE;

const ROLE_TOKEN_KEYS = {
  patient: "ic_token_patient",
  staff: "ic_token_staff",
  admin: "ic_token_admin"
};

/** Token for the portal you are on (staff vs patient vs admin stay independent). */
export function getActiveAuthToken() {
  if (typeof window === "undefined") return null;
  const p = window.location.pathname || "";
  if (p.startsWith("/admin")) return localStorage.getItem(ROLE_TOKEN_KEYS.admin) || localStorage.getItem("ic_token");
  if (p.startsWith("/staff")) return localStorage.getItem(ROLE_TOKEN_KEYS.staff) || localStorage.getItem("ic_token");
  if (p.startsWith("/patient")) return localStorage.getItem(ROLE_TOKEN_KEYS.patient) || localStorage.getItem("ic_token");
  return localStorage.getItem("ic_token");
}

export function persistAuthTokenForRole(role, token) {
  if (!token) return;
  const key = ROLE_TOKEN_KEYS[role];
  if (key) localStorage.setItem(key, token);
  localStorage.setItem("ic_token", token);
}

export function clearActiveAuthTokens() {
  if (typeof window === "undefined") return;
  const p = window.location.pathname || "";
  if (p.startsWith("/admin")) localStorage.removeItem(ROLE_TOKEN_KEYS.admin);
  else if (p.startsWith("/staff")) localStorage.removeItem(ROLE_TOKEN_KEYS.staff);
  else if (p.startsWith("/patient")) localStorage.removeItem(ROLE_TOKEN_KEYS.patient);
  localStorage.removeItem("ic_token");
}

function authHeader() {
  const t = getActiveAuthToken();
  if (!t) return {};
  return { Authorization: "Bearer " + t };
}

async function doFetch(path, opts) {
  const url = path.startsWith("http") ? path : BASE + (path.startsWith("/") ? path : "/" + path);
  try {
    return await fetch(url, opts);
  } catch (err) {
    if (err && (err.message === "Failed to fetch" || err.name === "TypeError")) {
      throw new Error("Is the server running? Check " + BASE);
    }
    throw err;
  }
}

async function handleRes(res) {
  const text = await res.text();
  if (!res.ok) {
    let msg = text || "error";
    try {
      const j = JSON.parse(text);
      if (j.message) msg = j.message;
    } catch (_) {
      /* keep text */
    }
    throw new Error(msg);
  }
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (_) {
    return {};
  }
}

export async function apiGet(path) {
  const res = await doFetch(path, { headers: { ...authHeader() } });
  return handleRes(res);
}

export async function apiPost(path, body) {
  const res = await doFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(body || {}),
  });
  return handleRes(res);
}

export async function apiPatch(path, body) {
  const res = await doFetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(body || {}),
  });
  return handleRes(res);
}

export async function apiDelete(path) {
  const res = await doFetch(path, { method: "DELETE", headers: { ...authHeader() } });
  return handleRes(res);
}
