import mongoose from "mongoose";

const passwordResetRequestSchema = new mongoose.Schema(
  {
    patientUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    patientEmail: { type: String, required: true, lowercase: true, trim: true },
    status: { type: String, enum: ["pending", "completed"], default: "pending" }
  },
  { timestamps: true }
);

passwordResetRequestSchema.index({ patientUserId: 1, status: 1 });

export default mongoose.model("PasswordResetRequest", passwordResetRequestSchema);
