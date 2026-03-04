import mongoose from "mongoose";

const deptSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    capacity: { type: Number, required: true },
    availableBeds: { type: Number, required: true },
    status: { type: String, default: "stable" },
  },
  { timestamps: true }
);

export default mongoose.model("Department", deptSchema);
