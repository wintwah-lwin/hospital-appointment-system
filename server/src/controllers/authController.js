import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, email: user.email, nric: user.nric },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export const registerPatient = async (req, res) => {
  const { nric, dob, password, displayName, email } = req.body || {};
  if (!nric || !password) return res.status(400).json({ message: "NRIC/FIN and password required" });

  const nricNorm = String(nric || "").trim().toUpperCase();
  const orCond = [{ nric: nricNorm }];
  if (email) orCond.push({ email: email.toLowerCase().trim() });
  const exists = await User.findOne({ $or: orCond });
  if (exists) return res.status(409).json({ message: "NRIC or email already registered" });

  const hashed = await hashPassword(password);
  const user = await User.create({
    nric: nricNorm,
    dob: dob ? new Date(dob) : null,
    password: hashed,
    role: "patient",
    displayName: displayName || "",
    email: email ? email.toLowerCase().trim() : null
  });

  const token = signToken(user);
  res.status(201).json({ token, user: { id: user._id, role: user.role, nric: user.nric, displayName: user.displayName } });
};

export const login = async (req, res) => {
  const { nric, dob, password, email } = req.body || {};
  // Patient: NRIC + password (DOB optional verification)
  if (nric && password) {
    const nricNorm = String(nric).trim().toUpperCase();
    const user = await User.findOne({ nric: nricNorm, role: "patient" });
    if (!user) return res.status(401).json({ message: "Invalid NRIC or password" });
    const ok = await verifyPassword(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid NRIC or password" });
    if (dob && user.dob) {
      const dobUser = new Date(user.dob).toISOString().slice(0, 10);
      const dobInput = new Date(dob).toISOString().slice(0, 10);
      if (dobUser !== dobInput) return res.status(401).json({ message: "Date of birth does not match" });
    }
    const token = signToken(user);
    return res.json({ token, user: { id: user._id, role: user.role, nric: user.nric, displayName: user.displayName } });
  }
  // Staff/Admin: email + password
  if (!email || !password) return res.status(400).json({ message: "NRIC + password (patient) or email + password (staff/admin) required" });
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const ok = await verifyPassword(password, user.password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });
  const token = signToken(user);
  res.json({ token, user: { id: user._id, role: user.role, email: user.email, displayName: user.displayName } });
};

export const me = async (req, res) => {
  const user = await User.findById(req.user.id).select("_id email nric dob role displayName");
  res.json({ user });
};
