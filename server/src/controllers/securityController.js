import LoginEvent from "../models/LoginEvent.js";
import SecurityAlert from "../models/SecurityAlert.js";

export const deleteLoginEvent = async (req, res) => {
  const { id } = req.params;
  const deleted = await LoginEvent.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ message: "Login event not found" });
  res.json({ ok: true });
};

export const listLoginEvents = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const skip = parseInt(req.query.skip, 10) || 0;
  const role = req.query.role?.trim();
  const success = req.query.success;
  const identifier = req.query.identifier?.trim();

  const q = {};
  if (role) q.role = role;
  if (success !== undefined) q.success = success === "true";
  if (identifier) q.identifier = new RegExp(identifier, "i");

  const [events, total] = await Promise.all([
    LoginEvent.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    LoginEvent.countDocuments(q)
  ]);

  res.json({ events, total });
};

export const listSecurityAlerts = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const skip = parseInt(req.query.skip, 10) || 0;
  const severity = req.query.severity?.trim();

  const q = {};
  if (severity) q.severity = severity;

  const [alerts, total] = await Promise.all([
    SecurityAlert.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    SecurityAlert.countDocuments(q)
  ]);

  res.json({ alerts, total });
};

export const getSecuritySummary = async (req, res) => {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalLogins24h,
    failedLogins24h,
    uniqueUsers24h,
    alerts24h,
    alertsUnresolved
  ] = await Promise.all([
    LoginEvent.countDocuments({ createdAt: { $gte: last24h } }),
    LoginEvent.countDocuments({ success: false, createdAt: { $gte: last24h } }),
    LoginEvent.distinct("identifier", { success: true, createdAt: { $gte: last24h } }).then((a) => a.length),
    SecurityAlert.countDocuments({ createdAt: { $gte: last24h } }),
    SecurityAlert.countDocuments({ createdAt: { $gte: last7d } })
  ]);

  res.json({
    last24h: {
      totalLogins: totalLogins24h,
      failedLogins: failedLogins24h,
      uniqueUsers: uniqueUsers24h,
      alerts: alerts24h
    },
    alertsLast7Days: alertsUnresolved
  });
};
