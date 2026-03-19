import { getRequestContext } from "../utils/requestContext.js";
import { checkIpAllowed } from "../services/geoCheck.js";

/**
 * Middleware: block requests from outside Singapore and from VPN/proxy.
 * Use on login, register, and other sensitive entry points.
 */
export async function requireSingaporeNoVPN(req, res, next) {
  const { ip } = getRequestContext(req);
  const result = await checkIpAllowed(ip);
  if (!result.ok) {
    return res.status(403).json({ message: result.reason });
  }
  next();
}
