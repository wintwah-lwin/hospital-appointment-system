import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, sparse: true, unique: true, lowercase: true, trim: true }, // staff/admin use email; patients may have for notifications
    nric: { type: String, sparse: true, unique: true, trim: true, uppercase: true }, // NRIC/FIN for patients (SG)
    dob: { type: Date, default: null }, // Date of birth for patients
    password: { type: String, required: true }, // hashed
    role: { type: String, enum: ["patient", "staff", "admin"], default: "patient" },
    displayName: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
