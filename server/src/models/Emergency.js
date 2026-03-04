import mongoose from "mongoose";

const emergencySchema = new mongoose.Schema(
  {
    ticket: { type: String, required: true, unique: true },
    priority: { type: String, required: true },
    etaMins: { type: Number, required: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Emergency", emergencySchema);
