import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["patient", "staff", "admin"], default: "patient" },
    displayName: { type: String, default: "" },
    dob: { type: Date, default: null },
    phone: { type: String, default: "" },
    mustChangePassword: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
