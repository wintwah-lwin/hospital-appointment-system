import mongoose from "mongoose";
import crypto from "crypto";

const passwordRecoveryTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export function generateRecoveryTokenString() {
  return crypto.randomBytes(32).toString("hex");
}

export default mongoose.model("PasswordRecoveryToken", passwordRecoveryTokenSchema);
