import jwt from "jsonwebtoken";
import User from "../models/User.js";
import LoginEvent from "../models/LoginEvent.js";
import SecurityAlert from "../models/SecurityAlert.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { validatePassword, sanitizeString } from "../utils/passwordValidation.js";
import { getRequestContext } from "../utils/requestContext.js";
import { assessLoginRisk } from "../services/riskEngine.js";

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function logLoginAndAssess({ user, identifier, success, req }) {
  const { ip, userAgent, deviceHash } = getRequestContext(req);
  const risk = await assessLoginRisk({
    identifier,
    ip,
    deviceHash,
    success
  });

  const event = await LoginEvent.create({
    userId: user?._id,
    identifier,
    displayName: user?.displayName || "",
    role: user?.role,
    success,
    ip,
    userAgent,
    deviceHash,
    riskScore: risk.score,
    riskReasons: risk.reasons,
    action: risk.action
  });

  if (risk.score >= 50) {
    await SecurityAlert.create({
      userId: user?._id,
      identifier,
      displayName: user?.displayName || "",
      role: user?.role,
      alertType: risk.reasons.includes("Too many failed login attempts") ? "blocked_login" : "suspicious_login",
      severity: risk.score >= 70 ? "high" : "medium",
      message: risk.reasons.join("; "),
      ip,
      userAgent,
      metadata: { riskScore: risk.score }
    });
  }

  if (risk.action === "block") {
    return { blocked: true, message: "Too many failed attempts. Please try again later." };
  }
  return { blocked: false };
}

function isAtLeast16(dob) {
  if (!dob) return false;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age >= 16;
}

export const registerPatient = async (req, res) => {
  const { email, password, displayName, dob } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });
  if (!dob) return res.status(400).json({ message: "Date of birth required" });

  const dobDate = new Date(dob);
  if (Number.isNaN(dobDate.getTime())) return res.status(400).json({ message: "Invalid date of birth" });
  if (!isAtLeast16(dobDate)) return res.status(400).json({ message: "You must be at least 16 years old to register" });

  const pv = validatePassword(password);
  if (!pv.ok) return res.status(400).json({ message: pv.message });

  const emailNorm = email.toLowerCase().trim();
  const exists = await User.findOne({ email: emailNorm });
  if (exists) return res.status(409).json({ message: "Email already registered" });

  const hashed = await hashPassword(password);
  const user = await User.create({
    email: emailNorm,
    password: hashed,
    role: "patient",
    displayName: sanitizeString(displayName, 100) || "",
    dob: dobDate
  });

  const token = signToken(user);
  res.status(201).json({ token, user: { id: user._id, role: user.role, email: user.email, displayName: user.displayName } });
};

export const login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });
  const emailNorm = email.toLowerCase().trim();
  const user = await User.findOne({ email: emailNorm });
  if (!user) {
    const blockCheck = await logLoginAndAssess({ user: null, identifier: emailNorm, success: false, req });
    if (blockCheck.blocked) return res.status(429).json({ message: blockCheck.message });
    return res.status(401).json({ message: "Invalid email or password" });
  }
  if (user.isBanned) return res.status(403).json({ message: "This account has been banned. Please contact support." });
  const ok = await verifyPassword(password, user.password);
  if (!ok) {
    const blockCheck = await logLoginAndAssess({ user, identifier: emailNorm, success: false, req });
    if (blockCheck.blocked) return res.status(429).json({ message: blockCheck.message });
    return res.status(401).json({ message: "Invalid email or password" });
  }
  const blockCheck = await logLoginAndAssess({ user, identifier: emailNorm, success: true, req });
  if (blockCheck.blocked) return res.status(429).json({ message: blockCheck.message });
  const token = signToken(user);
  res.json({ token, user: { id: user._id, role: user.role, email: user.email, displayName: user.displayName } });
};

export const me = async (req, res) => {
  const user = await User.findById(req.user.id).select("_id email role displayName dob isBanned").lean();
  const out = user ? { ...user, id: user._id } : null;
  res.json({ user: out });
};
