/**
 * IP geolocation and VPN/proxy check using ip-api.com (free tier).
 * Blocks non-Singapore IPs and VPN/proxy users.
 */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min cache per IP
const cache = new Map();

function isPrivateOrLocal(ip) {
  if (!ip || ip === "::1" || ip === "127.0.0.1") return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("172.16.") || ip.startsWith("172.17.") || ip.startsWith("172.18.") || ip.startsWith("172.19.") || ip.startsWith("172.2") || ip.startsWith("172.30.") || ip.startsWith("172.31.")) return true;
  return false;
}

export async function checkIpAllowed(ip) {
  if (!ip) return { ok: false, reason: "No IP address" };
  if (process.env.SKIP_GEO_CHECK === "true" || process.env.SKIP_GEO_CHECK === "1") return { ok: true };
  if (isPrivateOrLocal(ip)) return { ok: true };

  const cached = cache.get(ip);
  if (cached && Date.now() < cached.expires) return cached.result;

  try {
    const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode,proxy`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "success") {
      const result = { ok: false, reason: "Unable to verify your location. Please try again." };
      cache.set(ip, { result, expires: Date.now() + 60000 });
      return result;
    }

    if (data.countryCode !== "SG") {
      const result = { ok: false, reason: "Access is restricted to Singapore only. Your location could not be verified." };
      cache.set(ip, { result, expires: Date.now() + CACHE_TTL_MS });
      return result;
    }

    if (data.proxy === true) {
      const result = { ok: false, reason: "VPN and proxy connections are not allowed. Please disconnect and try again." };
      cache.set(ip, { result, expires: Date.now() + CACHE_TTL_MS });
      return result;
    }

    const result = { ok: true };
    cache.set(ip, { result, expires: Date.now() + CACHE_TTL_MS });
    return result;
  } catch (err) {
    console.error("[geoCheck]", err?.message || err);
    const result = { ok: false, reason: "Unable to verify your connection. Please try again later." };
    cache.set(ip, { result, expires: Date.now() + 30000 });
    return result;
  }
}
