// API URL: set VITE_API_BASE_URL in env/frontend/.env
const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

function authHeader() {
  const t = localStorage.getItem("ic_token");
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
