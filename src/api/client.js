const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

function authHeader() {
  const token = localStorage.getItem("ic_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function doFetch(url, opts) {
  const fullUrl = url.startsWith("http") ? url : `${BASE}${url}`;
  try {
    return await fetch(fullUrl, opts);
  } catch (err) {
    const isNetwork = err?.message === "Failed to fetch" || err?.name === "TypeError";
    throw new Error(
      isNetwork ? `Cannot reach API at ${BASE}. Start the backend (see README).` : String(err?.message || err)
    );
  }
}

async function handleRes(res) {
  const text = await res.text().catch(() => `${res.status} ${res.statusText}`);
  if (!res.ok) {
    let msg = text || "Request failed";
    try { const j = JSON.parse(text); if (j?.message) msg = j.message; } catch { /* use text */ }
    throw new Error(msg);
  }
  if (!text) return {};
  try { return JSON.parse(text); } catch { return {}; }
}

export async function apiGet(path) {
  const res = await doFetch(`${BASE}${path}`, { headers: { ...authHeader() } });
  return handleRes(res);
}

export async function apiPost(path, body) {
  const res = await doFetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(body ?? {}),
  });
  return handleRes(res);
}

export async function apiPatch(path, body) {
  const res = await doFetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(body ?? {}),
  });
  return handleRes(res);
}

export async function apiDelete(path) {
  const res = await doFetch(`${BASE}${path}`, { method: "DELETE", headers: { ...authHeader() } });
  return handleRes(res);
}
