import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Verifies JWT then attaches **current** role (and id) from the database so
 * /api/auth/me and requireRole stay in sync after role changes (until token expires).
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }

  const userId = payload.id || payload.sub;
  if (!userId) return res.status(401).json({ message: "Invalid token" });

  User.findById(userId)
    .select("role isBanned")
    .lean()
    .then((user) => {
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      if (user.isBanned) {
        return res.status(403).json({ message: "This account has been banned. Please contact support." });
      }
      req.user = { ...payload, id: userId, role: user.role };
      next();
    })
    .catch(next);
}

// Optional auth: attach req.user when token exists (role from DB, same as requireAuth).
export function attachAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return next();
  }

  const userId = payload.id || payload.sub;
  if (!userId) return next();

  User.findById(userId)
    .select("role isBanned")
    .lean()
    .then((user) => {
      if (!user || user.isBanned) {
        req.user = null;
        return next();
      }
      req.user = { ...payload, id: userId, role: user.role };
      next();
    })
    .catch(() => next());
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.role) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}
