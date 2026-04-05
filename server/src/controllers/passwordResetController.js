import PasswordResetRequest from "../models/PasswordResetRequest.js";
import PasswordRecoveryToken, { generateRecoveryTokenString } from "../models/PasswordRecoveryToken.js";
import User from "../models/User.js";

export const listPasswordResetRequests = async (req, res) => {
  const items = await PasswordResetRequest.find({})
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  res.json(items);
};

export const approvePasswordResetRequest = async (req, res) => {
  const { id } = req.params;
  const reqDoc = await PasswordResetRequest.findById(id);
  if (!reqDoc || reqDoc.status !== "pending") {
    return res.status(404).json({ message: "Request not found or already completed" });
  }
  const user = await User.findById(reqDoc.patientUserId);
  if (!user || user.role !== "patient") return res.status(404).json({ message: "Patient account not found" });
  if (user.isBanned) return res.status(400).json({ message: "Account is banned" });

  await PasswordRecoveryToken.updateMany({ userId: user._id, used: false }, { $set: { used: true } });

  const raw = generateRecoveryTokenString();
  const expiresAt = new Date(Date.now() + 48 * 3600 * 1000);
  await PasswordRecoveryToken.create({ userId: user._id, token: raw, expiresAt });

  reqDoc.status = "completed";
  await reqDoc.save();

  res.json({
    token: raw,
    recoverPath: `/recover-password?token=${raw}`,
    expiresAt: expiresAt.toISOString()
  });
};
