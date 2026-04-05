import mongoose from "mongoose";

const loginEventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    identifier: { type: String, index: true },
    displayName: { type: String, default: "" },
    role: { type: String, enum: ["patient", "staff", "admin"] },
    success: { type: Boolean, required: true },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    deviceHash: { type: String, default: "" },
    riskScore: { type: Number, default: 0 },
    riskReasons: [{ type: String }],
    action: { type: String, enum: ["allow", "allow_log", "block"], default: "allow" },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

loginEventSchema.index({ createdAt: -1 });
loginEventSchema.index({ identifier: 1, createdAt: -1 });

export default mongoose.model("LoginEvent", loginEventSchema);
