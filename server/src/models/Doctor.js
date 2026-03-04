import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    specialty: { type: String, enum: ["General", "Cardiology", "Neurology", "Orthopedics", "ICU"], default: "General" },
    room: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    notes: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("Doctor", doctorSchema);
