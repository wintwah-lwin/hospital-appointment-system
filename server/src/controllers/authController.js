import jwt from "jsonwebtoken";
import User from "../models/User.js";
import LoginEvent from "../models/LoginEvent.js";
import SecurityAlert from "../models/SecurityAlert.js";
import PasswordResetRequest from "../models/PasswordResetRequest.js";
import PasswordRecoveryToken from "../models/PasswordRecoveryToken.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { validatePassword, sanitizeString } from "../utils/passwordValidation.js";
import { getRequestContext } from "../utils/requestContext.js";
import { assessLoginRisk } from "../services/riskEngine.js";
import { notifyAdmins } from "../utils/notify.js";

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
  res.status(201).json({
    token,
    user: {
      id: user._id,
      role: user.role,
      email: user.email,
      displayName: user.displayName,
      mustChangePassword: !!user.mustChangePassword,
      phone: user.phone || "",
      dob: user.dob || null
    }
  });
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
  res.json({
    token,
    user: {
      id: user._id,
      role: user.role,
      email: user.email,
      displayName: user.displayName,
      mustChangePassword: !!user.mustChangePassword,
      phone: user.phone || "",
      dob: user.dob || null
    }
  });
};

export const me = async (req, res) => {
  const user = await User.findById(req.user.id)
    .select("_id email role displayName dob isBanned phone mustChangePassword")
    .lean();
  const out = user
    ? {
        ...user,
        id: user._id,
        mustChangePassword: !!user.mustChangePassword,
        phone: user.phone || ""
      }
    : null;
  res.json({ user: out });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body || {};
  const emailNorm = String(email || "")
    .toLowerCase()
    .trim();
  if (!emailNorm) return res.status(400).json({ message: "Email is required" });

  const user = await User.findOne({ email: emailNorm });
  const generic = { ok: true };

  if (!user || user.role !== "patient" || user.isBanned) {
    return res.json(generic);
  }

  await PasswordResetRequest.deleteMany({ patientUserId: user._id, status: "pending" });
  await PasswordResetRequest.create({
    patientUserId: user._id,
    patientEmail: emailNorm
  });

  await notifyAdmins({
    type: "PASSWORD_RESET_REQUEST",
    message: `${emailNorm}`
  });

  res.json(generic);
};

export const recoverSession = async (req, res) => {
  const { token } = req.body || {};
  if (!token || typeof token !== "string") return res.status(400).json({ message: "Token required" });
  const trimmed = token.trim();
  const rec = await PasswordRecoveryToken.findOne({ token: trimmed, used: false });
  if (!rec || rec.expiresAt < new Date()) {
    return res.status(400).json({ message: "Invalid link." });
  }
  const user = await User.findById(rec.userId);
  if (!user || user.isBanned) return res.status(400).json({ message: "Invalid link." });

  rec.used = true;
  await rec.save();

  user.mustChangePassword = true;
  await user.save();

  const jwtToken = signToken(user);
  res.json({
    token: jwtToken,
    user: {
      id: user._id,
      role: user.role,
      email: user.email,
      displayName: user.displayName,
      mustChangePassword: true,
      phone: user.phone || "",
      dob: user.dob || null
    }
  });
};

export const changePassword = async (req, res) => {
  const { newPassword, currentPassword } = req.body || {};
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "Not found" });

  const pv = validatePassword(newPassword);
  if (!pv.ok) return res.status(400).json({ message: pv.message });

  if (!user.mustChangePassword) {
    if (!currentPassword) return res.status(400).json({ message: "Current password is required" });
    const ok = await verifyPassword(currentPassword, user.password);
    if (!ok) return res.status(400).json({ message: "Current password is incorrect" });
  }

  user.password = await hashPassword(newPassword);
  user.mustChangePassword = false;
  await user.save();

  res.json({ ok: true });
};

export const updatePatientProfile = async (req, res) => {
  if (req.user.role !== "patient") return res.status(403).json({ message: "Forbidden" });

  const { displayName, dob, phone, email } = req.body || {};
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "Not found" });

  if (email !== undefined && String(email).toLowerCase().trim() !== user.email) {
    const emailNorm = String(email || "")
      .toLowerCase()
      .trim();
    if (!emailNorm) return res.status(400).json({ message: "Email cannot be empty" });
    const taken = await User.findOne({ email: emailNorm, _id: { $ne: user._id } });
    if (taken) return res.status(409).json({ message: "Email already in use" });
    user.email = emailNorm;
  }

  if (displayName !== undefined) {
    user.displayName = sanitizeString(displayName, 100) || "";
  }
  if (phone !== undefined) {
    user.phone = sanitizeString(phone, 30) || "";
  }
  if (dob !== undefined) {
    const dobDate = dob ? new Date(dob) : null;
    if (dobDate && Number.isNaN(dobDate.getTime())) return res.status(400).json({ message: "Invalid date of birth" });
    if (dobDate && !isAtLeast16(dobDate)) return res.status(400).json({ message: "Date of birth implies age under 16" });
    user.dob = dobDate;
  }

  await user.save();

  res.json({
    user: {
      id: user._id,
      role: user.role,
      email: user.email,
      displayName: user.displayName,
      phone: user.phone || "",
      dob: user.dob || null,
      mustChangePassword: !!user.mustChangePassword
    }
  });
};
